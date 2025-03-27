import torch
import torch.nn as nn
import pytorch_lightning as pl
from torchvision import transforms
from PIL import Image

# Define BasicBlock and ResNet classes (same for both tasks)
class BasicBlock(nn.Module):
    expansion = 1
    def __init__(self, inplanes, planes, stride=1, downsample=None):
        super().__init__()
        self.add_relu = torch.nn.quantized.FloatFunctional()
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
        self.quant = torch.quantization.QuantStub()
        self.dequant = torch.quantization.DeQuantStub()
    
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
    layers = [3, 4, 6, 3]
    model = ResNet(BasicBlock, layers)
    return model

def get_model():
    model = resnet34()
    return model

class ImageClassifier(pl.LightningModule):
    def __init__(self, model, num_classes=4, lr=1e-3):
        super().__init__()
        self.save_hyperparameters(ignore=['model'])
        self.model = model
    
    def forward(self, x):
        return self.model(x)

def preprocess_image(image_path):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
    ])
    image = Image.open(image_path).convert('RGB')
    image = transform(image)
    image = image.unsqueeze(0)
    return image

def predict(image_path, model, device, classes):
    image = preprocess_image(image_path)
    image = image.to(device)
    model.eval()
    with torch.no_grad():
        outputs = model(image)
        probabilities = torch.softmax(outputs, dim=1)[0]
        predicted_class_idx = torch.argmax(probabilities).item()
        predicted_class = classes[predicted_class_idx]
        confidence = probabilities[predicted_class_idx].item() * 100
    return predicted_class, confidence

def main():
    # # Set device to GPU:6 if available, otherwise fall back to CPU
    # if torch.cuda.is_available() and torch.cuda.device_count() > 6:
    #     device = torch.device('cuda:6')
    #     print(f"Running on GPU:6")
    # else:
    #     device = torch.device('cpu')
    #     print("GPU:6 not available, falling back to CPU")
    # print(f"Running on {device}")

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    # device = torch.device('cpu')
    print(f"Running on {device}")

    # Define class names
    orientation_classes = ('hdvb', 'hdvf', 'huvb', 'huvf')
    plane_classes = ('AC_PLANE', 'BPD_PLANE', 'NO_Plane', 'FL_PLANE')

    # Hardcode the image path
    # image_path = 'Orientation_SampleDataset/hdvf/frame_000002.png'
    image_path = 'img.jpeg'

    # Load models with optimized loading
    orientation_model_path = 'Orientation_RES34.pth'
    plane_model_path = 'PLANE_34.pth'

    # Create and load models
    model = get_model()
    classifier = ImageClassifier(model)

    # Load orientation model
    classifier = torch.load(orientation_model_path, map_location=device,weights_only=False)
    classifier.to(device)

    # Predict orientation
    predicted_orientation, orientation_confidence = predict(
        image_path, classifier, device, orientation_classes
    )
    print(f"Predicted Orientation: {predicted_orientation}")
    print(f"Orientation Confidence: {orientation_confidence:.2f}%")

    # Load plane model
    state_dict = torch.load(plane_model_path, map_location=device, weights_only=False)
    classifier.load_state_dict(state_dict)
    classifier.to(device)

    # Predict plane
    predicted_plane, plane_confidence = predict(
        image_path, classifier, device, plane_classes
    )
    print(f"Predicted Plane: {predicted_plane}")
    print(f"Plane Confidence: {plane_confidence:.2f}%")

if __name__ == "__main__":
    main()