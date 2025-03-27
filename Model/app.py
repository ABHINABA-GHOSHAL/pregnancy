from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn as nn
import pytorch_lightning as pl
from torchvision import transforms
from PIL import Image
import io

# Model definitions (unchanged)
class BasicBlock(nn.Module):
    expansion = 1
    def __init__(self, inplanes, planes, stride=1, downsample=None):
        super().__init__()
        self.conv1 = nn.Conv2d(inplanes, planes, kernel_size=3, stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(planes)
        self.relu = nn.ReLU(inplace=True)
        self.conv2 = nn.Conv2d(planes, planes, kernel_size=3, stride=1, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(planes)
        self.downsample = downsample
        self.stride = stride
    
    def forward(self, x):
        identity = x
        out = self.conv1(x)
        out = self.bn1(out)
        out = self.relu(out)
        out = self.conv2(out)
        out = self.bn2(out)
        if self.downsample is not None:
            identity = self.downsample(x)
        out += identity
        return out

class ResNet(nn.Module):
    def __init__(self, block, layers, num_classes=4):
        super().__init__()
        self.inplanes = 64
        self.conv1 = nn.Conv2d(3, self.inplanes, kernel_size=7, stride=2, padding=3, bias=False)
        self.bn1 = nn.BatchNorm2d(self.inplanes)
        self.relu = nn.ReLU(inplace=True)
        self.maxpool = nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
        self.layer1 = self._make_layer(block, 64, layers[0])
        self.layer2 = self._make_layer(block, 128, layers[1], stride=2)
        self.layer3 = self._make_layer(block, 256, layers[2], stride=2)
        self.layer4 = self._make_layer(block, 512, layers[3], stride=2)
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(512, num_classes)
    
    def _make_layer(self, block, planes, blocks, stride=1):
        downsample = None
        if stride != 1 or self.inplanes != planes:
            downsample = nn.Sequential(
                nn.Conv2d(self.inplanes, planes, 1, stride, bias=False), 
                nn.BatchNorm2d(planes)
            )
        layers = []
        layers.append(block(self.inplanes, planes, stride, downsample))
        self.inplanes = planes
        for _ in range(1, blocks):
            layers.append(block(self.inplanes, planes))
        return nn.Sequential(*layers)
    
    def forward(self, x):
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.fc(x)
        return x

def resnet34():
    return ResNet(BasicBlock, [3, 4, 6, 3])

def get_model():
    return resnet34()

class ImageClassifier(pl.LightningModule):
    def __init__(self, model, num_classes=4, lr=1e-3):
        super().__init__()
        self.save_hyperparameters(ignore=['model'])
        self.model = model
    
    def forward(self, x):
        return self.model(x)

# Flask app setup
app = Flask(__name__)
CORS(app)

# Initialize device
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Running on {device}")

# Define class names
orientation_classes = ('hdvb', 'hdvf', 'huvb', 'huvf')
plane_classes = ('AC_PLANE', 'BPD_PLANE', 'NO_Plane', 'FL_PLANE')

# Load models
orientation_model_path = 'Orientation_RES34.pth'
plane_model_path = 'PLANE_34.pth'

try:
    orientation_classifier = torch.load(orientation_model_path, map_location=device, weights_only=False)
    orientation_classifier.to(device)
    orientation_classifier.eval()
except Exception as e:
    print(f"Error loading orientation model: {e}")
    raise

try:
    plane_model = get_model()
    plane_classifier = ImageClassifier(plane_model)
    state_dict = torch.load(plane_model_path, map_location=device, weights_only=False)
    plane_classifier.load_state_dict(state_dict)
    plane_classifier.to(device)
    plane_classifier.eval()
except Exception as e:
    print(f"Error loading plane model: {e}")
    raise

def preprocess_image(image_data):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
    ])
    image = Image.open(io.BytesIO(image_data)).convert('RGB')
    image = transform(image)
    image = image.unsqueeze(0)
    return image

def predict(image, model, device, classes):
    image = image.to(device)
    with torch.no_grad():
        outputs = model(image)
        probabilities = torch.softmax(outputs, dim=1)[0]
        predicted_class_idx = torch.argmax(probabilities).item()
        predicted_class = classes[predicted_class_idx]
        confidence = probabilities[predicted_class_idx].item() * 100
    return predicted_class, confidence

@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict_image():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'success'})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response, 200

    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image selected'}), 400

        if not file.mimetype.startswith('image/'):
            return jsonify({'error': 'Invalid file type. Please upload an image.'}), 400

        image_data = file.read()
        image = preprocess_image(image_data)
        
        orientation_pred, orientation_conf = predict(
            image, orientation_classifier, device, orientation_classes
        )
        
        plane_pred, plane_conf = predict(
            image, plane_classifier, device, plane_classes
        )
        
        result = {
            'orientation': {
                'prediction': orientation_pred,
                'confidence': float(orientation_conf)
            },
            'plane': {
                'prediction': plane_pred,
                'confidence': float(plane_conf)
            }
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)