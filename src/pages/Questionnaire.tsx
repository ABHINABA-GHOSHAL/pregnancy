import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { toast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";

interface QuestionSectionProps {
  title: string;
  children: React.ReactNode;
}

const QuestionSection: React.FC<QuestionSectionProps> = ({ title, children }) => {
  return (
    <div className="mb-8 bg-white rounded-lg shadow-md p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="space-y-6">{children}</div>
    </div>
  );
};

const QuestionnaireForm: React.FC = () => {
  const navigate = useNavigate();
  const { isRegistered, patientData, setQuestionnaireCompleted, setQuestionnaireData } = useApp();
  const [formData, setFormData] = useState({
    // Vital Signs
    bloodPressure: "",
    bodyTemperature: "",
    pulseRate: "",

    // Obstetric History
    isFirstPregnancy: "Yes",
    previousPregnancyDetails: "",

    // Medical History
    allergies: "",
    currentMedications: "",
    pcosPcod: "No", // New field for PCOS/PCOD question
    pcosPcodDetails: "", // New field for PCOS/PCOD details if "Yes"

    // Family Medical History
    geneticDisorders: "No",
    geneticDisordersDetails: "",
    familyPregnancyComplications: "No",
    familyPregnancyComplicationsDetails: "",

    // Lifestyle and Habits
    smokingStatus: "Never smoked",
    alcoholConsumption: "None",
    drugUse: ["None"],
    dietHabits: "",
    exerciseFrequency: "Occasionally (1-2 times/week)",

    // Current Pregnancy Symptoms
    currentSymptoms: ["None"],
    concerningSymptoms: ["None"],
    symptomDetails: "",

    // Mental Health
    emotionalWellbeing: "Mostly positive",
    mentalHealthHistory: "No",
    mentalHealthDetails: "",
    safetyConcerns: "No",
    safetyConcernsDetails: "",

    // Nutrition and Supplementation
    prenatalVitamins: "Yes, regularly",
    dietaryRestrictions: "No",
    dietaryRestrictionsDetails: "",
    foodAversions: "",

    // Exercise and Physical Activity
    physicalActivityTypes: ["Walking"],
    otherPhysicalActivity: "",
    activityFrequency: "3-5 times per week",

    // Additional comments
    additionalComments: "",
  });

  useEffect(() => {
    if (!isRegistered) {
      navigate("/register");
    }
  }, [isRegistered, navigate]);

  const handleCheckboxGroupChange = (field: string, value: string) => {
    let updatedValues;

    if (formData[field as keyof typeof formData] && Array.isArray(formData[field as keyof typeof formData])) {
      const currentValues = formData[field as keyof typeof formData] as string[];

      if (value === "None") {
        // If "None" is selected, clear all other selections
        updatedValues = currentValues.includes("None") ? [] : ["None"];
      } else {
        // If any other value is selected, remove "None" from the list
        updatedValues = currentValues.filter((v) => v !== "None");

        // Toggle the selected value
        if (updatedValues.includes(value)) {
          updatedValues = updatedValues.filter((v) => v !== value);
        } else {
          updatedValues.push(value);
        }

        // If no values are selected, add "None"
        if (updatedValues.length === 0) {
          updatedValues = ["None"];
        }
      }

      setFormData({
        ...formData,
        [field]: updatedValues,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Save data to context
    setQuestionnaireData(formData);
    setQuestionnaireCompleted(true);

    toast({
      title: "Questionnaire Saved",
      description: "Your health questionnaire has been successfully saved.",
    });

    // Navigate to dashboard
    navigate("/dashboard");
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 pb-16">
        <h1 className="text-2xl font-bold mb-6">Pregnancy Health Questionnaire</h1>

        <Card className="mb-8">
          <CardHeader className="bg-blue-50 rounded-t-lg">
            <CardTitle>
              Patient: {patientData.firstName} {patientData.lastName}
            </CardTitle>
          </CardHeader>
        </Card>

        <form onSubmit={handleSubmit}>
          {/* Vital Signs Section */}
          <QuestionSection title="Vital Signs">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="blood-pressure">Blood Pressure (mmHg, e.g., 120/80)</Label>
                <Input
                  id="blood-pressure"
                  type="text"
                  placeholder="e.g., 120/80"
                  value={formData.bloodPressure}
                  onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body-temperature">Body Temperature (°F, e.g., 98.6)</Label>
                <Input
                  id="body-temperature"
                  type="text"
                  placeholder="e.g., 98.6"
                  value={formData.bodyTemperature}
                  onChange={(e) => setFormData({ ...formData, bodyTemperature: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pulse-rate">Pulse Rate (beats per minute, e.g., 72)</Label>
                <Input
                  id="pulse-rate"
                  type="text"
                  placeholder="e.g., 72"
                  value={formData.pulseRate}
                  onChange={(e) => setFormData({ ...formData, pulseRate: e.target.value })}
                />
              </div>
            </div>
          </QuestionSection>

          {/* Obstetric History */}
          <QuestionSection title="1. Obstetric History">
            <div className="space-y-4">
              <div>
                <Label className="text-base">Is this your first pregnancy?</Label>
                <RadioGroup
                  value={formData.isFirstPregnancy}
                  onValueChange={(value) => setFormData({ ...formData, isFirstPregnancy: value })}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="first-preg-yes" />
                    <Label htmlFor="first-preg-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="first-preg-no" />
                    <Label htmlFor="first-preg-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.isFirstPregnancy === "No" && (
                <div className="space-y-2">
                  <Label htmlFor="previous-pregnancy-details">
                    Please provide details of previous pregnancies (outcomes, complications, etc.)
                  </Label>
                  <Textarea
                    id="previous-pregnancy-details"
                    value={formData.previousPregnancyDetails}
                    onChange={(e) => setFormData({ ...formData, previousPregnancyDetails: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-base">Last Menstrual Period (LMP)</Label>
                  <div className="font-medium mt-1">{new Date(patientData.lmp || "").toLocaleDateString()}</div>
                </div>
                <div>
                  <Label className="text-base">Estimated Due Date</Label>
                  <div className="font-medium mt-1">{new Date(patientData.dueDate || "").toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </QuestionSection>

          {/* Medical History */}
          <QuestionSection title="2. Medical History">
            <div className="space-y-4">
              <div>
                <Label className="text-base">Pre-existing medical conditions recorded during registration:</Label>
                <div className="mt-2 ml-2">
                  {patientData.preexistingConditions && patientData.preexistingConditions.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {patientData.preexistingConditions.map((condition) => (
                        <li key={condition}>{condition}</li>
                      ))}
                      {patientData.preexistingConditions.includes("Other") && patientData.otherCondition && (
                        <li>Other: {patientData.otherCondition}</li>
                      )}
                    </ul>
                  ) : (
                    <p>- None recorded</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-base">Do you have or have you ever had PCOS/PCOD?</Label>
                <RadioGroup
                  value={formData.pcosPcod}
                  onValueChange={(value) => setFormData({ ...formData, pcosPcod: value })}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="pcos-pcod-yes" />
                    <Label htmlFor="pcos-pcod-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="pcos-pcod-no" />
                    <Label htmlFor="pcos-pcod-no">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Not sure" id="pcos-pcod-not-sure" />
                    <Label htmlFor="pcos-pcod-not-sure">Not sure</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.pcosPcod === "Yes" && (
                <div className="space-y-2">
                  <Label htmlFor="pcos-pcod-details">
                    Please provide details about your PCOS/PCOD (e.g., diagnosis, treatment, current status):
                  </Label>
                  <Textarea
                    id="pcos-pcod-details"
                    value={formData.pcosPcodDetails}
                    onChange={(e) => setFormData({ ...formData, pcosPcodDetails: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="allergies">Do you have any allergies? If yes, please list them.</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current-medications">List any current medications or supplements you are taking:</Label>
                <Textarea
                  id="current-medications"
                  value={formData.currentMedications}
                  onChange={(e) => setFormData({ ...formData, currentMedications: e.target.value })}
                />
              </div>
            </div>
          </QuestionSection>

          {/* Family Medical History */}
          <QuestionSection title="3. Family Medical History">
            <div className="space-y-4">
              <div>
                <Label className="text-base">Are there any genetic disorders or birth defects in your family?</Label>
                <RadioGroup
                  value={formData.geneticDisorders}
                  onValueChange={(value) => setFormData({ ...formData, geneticDisorders: value })}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="genetic-yes" />
                    <Label htmlFor="genetic-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="genetic-no" />
                    <Label htmlFor="genetic-no">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Not sure" id="genetic-not-sure" />
                    <Label htmlFor="genetic-not-sure">Not sure</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.geneticDisorders === "Yes" && (
                <div className="space-y-2">
                  <Label htmlFor="genetic-disorders-details">
                    Please provide details about the genetic disorders or birth defects:
                  </Label>
                  <Textarea
                    id="genetic-disorders-details"
                    value={formData.geneticDisordersDetails}
                    onChange={(e) => setFormData({ ...formData, geneticDisordersDetails: e.target.value })}
                  />
                </div>
              )}

              <div>
                <Label className="text-base">Is there a history of pregnancy complications in your close relatives?</Label>
                <RadioGroup
                  value={formData.familyPregnancyComplications}
                  onValueChange={(value) => setFormData({ ...formData, familyPregnancyComplications: value })}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="complications-yes" />
                    <Label htmlFor="complications-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="complications-no" />
                    <Label htmlFor="complications-no">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Not sure" id="complications-not-sure" />
                    <Label htmlFor="complications-not-sure">Not sure</Label>
                  </div>
                </RadioGroup>
              </div>

              {formData.familyPregnancyComplications === "Yes" && (
                <div className="space-y-2">
                  <Label htmlFor="family-pregnancy-complications-details">
                    Please provide details about the family history of pregnancy complications:
                  </Label>
                  <Textarea
                    id="family-pregnancy-complications-details"
                    value={formData.familyPregnancyComplicationsDetails}
                    onChange={(e) => setFormData({ ...formData, familyPregnancyComplicationsDetails: e.target.value })}
                  />
                </div>
              )}
            </div>
          </QuestionSection>

          {/* Lifestyle and Habits */}
          <QuestionSection title="4. Lifestyle and Habits">
            <div className="space-y-4">
              <div>
                <Label className="text-base">Smoking status:</Label>
                <RadioGroup
                  value={formData.smokingStatus}
                  onValueChange={(value) => setFormData({ ...formData, smokingStatus: value })}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Never smoked" id="smoking-never" />
                    <Label htmlFor="smoking-never">Never smoked</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Quit before pregnancy" id="smoking-quit-before" />
                    <Label htmlFor="smoking-quit-before">Quit before pregnancy</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Quit after becoming pregnant" id="smoking-quit-after" />
                    <Label htmlFor="smoking-quit-after">Quit after becoming pregnant</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Currently smoking" id="smoking-current" />
                    <Label htmlFor="smoking-current">Currently smoking</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-base">Alcohol consumption during pregnancy:</Label>
                <RadioGroup
                  value={formData.alcoholConsumption}
                  onValueChange={(value) => setFormData({ ...formData, alcoholConsumption: value })}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="None" id="alcohol-none" />
                    <Label htmlFor="alcohol-none">None</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Occasionally (less than once a month)" id="alcohol-occasional" />
                    <Label htmlFor="alcohol-occasional">Occasionally (less than once a month)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Monthly" id="alcohol-monthly" />
                    <Label htmlFor="alcohol-monthly">Monthly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Weekly" id="alcohol-weekly" />
                    <Label htmlFor="alcohol-weekly">Weekly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Daily" id="alcohol-daily" />
                    <Label htmlFor="alcohol-daily">Daily</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-base">Current medication or drug use (select all that apply):</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {["None", "Prescription medications", "Over-the-counter medications", "Herbal supplements", "Recreational drugs"].map(
                    (option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`drug-use-${option}`}
                          checked={(formData.drugUse as string[]).includes(option)}
                          onCheckedChange={() => handleCheckboxGroupChange("drugUse", option)}
                        />
                        <Label htmlFor={`drug-use-${option}`}>{option}</Label>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diet-habits">Describe your current diet habits:</Label>
                <Textarea
                  id="diet-habits"
                  value={formData.dietHabits}
                  onChange={(e) => setFormData({ ...formData, dietHabits: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-base">How often do you exercise?</Label>
                <RadioGroup
                  value={formData.exerciseFrequency}
                  onValueChange={(value) => setFormData({ ...formData, exerciseFrequency: value })}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Never" id="exercise-never" />
                    <Label htmlFor="exercise-never">Never</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Rarely (1-2 times/month)" id="exercise-rarely" />
                    <Label htmlFor="exercise-rarely">Rarely (1-2 times/month)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Occasionally (1-2 times/week)" id="exercise-occasionally" />
                    <Label htmlFor="exercise-occasionally">Occasionally (1-2 times/week)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Regularly (3-5 times/week)" id="exercise-regularly" />
                    <Label htmlFor="exercise-regularly">Regularly (3-5 times/week)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Daily" id="exercise-daily" />
                    <Label htmlFor="exercise-daily">Daily</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </QuestionSection>

          {/* Physical Activity */}
          <QuestionSection title="8. Exercise and Physical Activity">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-base">What types of physical activity do you engage in? (select all that apply)</Label>
                <div className="relative mt-2">
                  <div className="flex flex-wrap bg-gray-100 rounded-md p-2 gap-2">
                    {(formData.physicalActivityTypes as string[]).map((type) => (
                      <div key={type} className="flex items-center bg-materna-500 text-white rounded-md py-1 px-2 gap-1">
                        <span>{type}</span>
                        <button
                          type="button"
                          className="hover:bg-materna-600 rounded-full"
                          onClick={() => handleCheckboxGroupChange("physicalActivityTypes", type)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="absolute right-2 top-2">
                    <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full">
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2">
                  <Label className="text-base">How often do you engage in these physical activities?</Label>
                  <RadioGroup
                    value={formData.activityFrequency}
                    onValueChange={(value) => setFormData({ ...formData, activityFrequency: value })}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Daily" id="activity-daily" />
                      <Label htmlFor="activity-daily">Daily</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="3-5 times per week" id="activity-3-5" />
                      <Label htmlFor="activity-3-5">3-5 times per week</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1-2 times per week" id="activity-1-2" />
                      <Label htmlFor="activity-1-2">1-2 times per week</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Occasionally" id="activity-occasionally" />
                      <Label htmlFor="activity-occasionally">Occasionally</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Never" id="activity-never" />
                      <Label htmlFor="activity-never">Never</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </QuestionSection>

          {/* Additional Comments */}
          <QuestionSection title="Additional Comments">
            <div className="space-y-2">
              <Label htmlFor="additional-comments">
                Any additional comments or concerns you would like to share with your healthcare provider:
              </Label>
              <Textarea
                id="additional-comments"
                value={formData.additionalComments}
                onChange={(e) => setFormData({ ...formData, additionalComments: e.target.value })}
                className="min-h-[120px]"
              />
            </div>
          </QuestionSection>

          <div className="flex justify-center my-8">
            <Button type="submit" className="materna-button w-60">
              Save Questionnaire
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default QuestionnaireForm;