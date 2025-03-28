import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useApp } from "@/contexts/AppContext";
import { calculateDueDate, generatePatientId, getMedicalConditionsList } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setIsRegistered, setPatientData, patientData } = useApp();
  const [activeTab, setActiveTab] = useState("personal");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [successType, setSuccessType] = useState<"new" | "update" | null>(null);

  // Define initial form data with default values
  const initialFormData = {
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dob: "",
    gender: "Female",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    height: 160,
    preWeight: 60,
    currentWeight: 60,
    bloodGroup: "A+",
    lmp: format(new Date(), "yyyy-MM-dd"),
    dueDate: "",
    primaryProvider: "",
    preferredHospital: "",
    gravida: 1,
    para: 0,
    preexistingConditions: ["None"],
    otherCondition: "",
  };

  // Initialize form data with existing patient data if available
  const [formData, setFormData] = useState({
    ...initialFormData,
    ...patientData,
  });

  // Determine if this is an edit operation based on existing patient ID
  const isEditing = !!patientData.id;

  const handleLMPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lmpDate = new Date(e.target.value);
    const calculatedDueDate = calculateDueDate(lmpDate);
    setFormData({
      ...formData,
      lmp: e.target.value,
      dueDate: format(calculatedDueDate, "yyyy-MM-dd"),
    });
  };

  const handlePreexistingConditionsChange = (condition: string) => {
    let updatedConditions;
    if (condition === "None") {
      updatedConditions = formData.preexistingConditions.includes("None") ? [] : ["None"];
    } else {
      updatedConditions = formData.preexistingConditions.filter((c) => c !== "None");
      if (updatedConditions.includes(condition)) {
        updatedConditions = updatedConditions.filter((c) => c !== condition);
      } else {
        updatedConditions.push(condition);
      }
      if (updatedConditions.length === 0) {
        updatedConditions = ["None"];
      }
    }
    setFormData({
      ...formData,
      preexistingConditions: updatedConditions,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.lmp) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const wasNewRegistration = !patientData.id;

    if (patientData.id) {
      // Update existing patient data
      setPatientData({
        ...formData,
        id: patientData.id, // Retain the existing ID
      });
      setSuccessType("update");
      toast({
        title: "Profile Updated",
        description: "Your registration details have been updated.",
      });
    } else {
      // New registration
      const patientId = generatePatientId(formData.firstName, formData.lastName);
      const newPatientData = {
        id: patientId,
        ...formData,
      };
      setPatientData(newPatientData);
      setIsRegistered(true);
      setSuccessType("new");
      toast({
        title: "Registration Successful",
        description: `Your patient ID is: ${patientId}`,
      });
    }

    setRegistrationSuccess(true);
  };

  const navigateToDashboard = () => {
    navigate("/dashboard");
  };

  const nextTab = () => {
    if (activeTab === "personal") {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        toast({
          title: "Missing Information",
          description: "Please provide your name and email before continuing.",
          variant: "destructive",
        });
        return;
      }
      setActiveTab("health");
    } else if (activeTab === "health") {
      setActiveTab("pregnancy");
    }
  };

  const prevTab = () => {
    if (activeTab === "pregnancy") {
      setActiveTab("health");
    } else if (activeTab === "health") {
      setActiveTab("personal");
    }
  };

  const medicalConditions = getMedicalConditionsList();

  // Display success message after submission
  if (registrationSuccess) {
    return (
      <Layout>
        <div className="container mx-auto py-10 px-4 md:px-6 max-w-3xl animate-fade-in">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-center">
                {successType === "new" ? "Registration Successful!" : "Profile Updated Successfully"}
              </CardTitle>
              {successType === "new" && (
                <CardDescription className="text-center">
                  Your patient ID is: <span className="font-semibold">{patientData.id}</span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <p className="text-center text-muted-foreground">
                {successType === "new"
                  ? "You can now upload your medical reports and complete the health questionnaire."
                  : "Your registration details have been updated."}
              </p>
              <Button onClick={navigateToDashboard} className="materna-button">
                Continue to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-10 px-4 md:px-6 max-w-3xl animate-fade-in">
        <Card className="glass-panel mb-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-materna-600">
              {isEditing ? "Edit Patient Profile" : "Patient Registration"}
            </CardTitle>
            <CardDescription className="text-center">
              {isEditing
                ? "Update your registration details below."
                : "Please provide your information to create your pregnancy health profile"}
            </CardDescription>
          </CardHeader>
        </Card>

        <form onSubmit={handleSubmit} className="glass-panel">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="personal">Personal Information</TabsTrigger>
              <TabsTrigger value="health">Health Metrics</TabsTrigger>
              <TabsTrigger value="pregnancy">Pregnancy Information</TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      required
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      required
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="Phone Number"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      placeholder="Date of Birth"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Home Address</Label>
                    <Input
                      id="address"
                      placeholder="Home Address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContact"
                      placeholder="Emergency Contact Name"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Emergency Contact Number</Label>
                    <Input
                      id="emergencyPhone"
                      placeholder="Emergency Contact Number"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-8">
                  <Button type="button" onClick={nextTab} className="materna-button">
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Health Metrics Tab */}
            <TabsContent value="health">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <div className="flex">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-r-none"
                        onClick={() => setFormData({ ...formData, height: Math.max(140, formData.height - 1) })}
                      >
                        -
                      </Button>
                      <Input
                        id="height"
                        type="number"
                        className="rounded-none text-center"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 150 })}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-l-none"
                        onClick={() => setFormData({ ...formData, height: Math.min(220, formData.height + 1) })}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preWeight">Pre-pregnancy Weight (kg)</Label>
                    <div className="flex">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-r-none"
                        onClick={() => setFormData({ ...formData, preWeight: Math.max(40, formData.preWeight - 1) })}
                      >
                        -
                      </Button>
                      <Input
                        id="preWeight"
                        type="number"
                        className="rounded-none text-center"
                        value={formData.preWeight}
                        onChange={(e) => setFormData({ ...formData, preWeight: parseInt(e.target.value) || 60 })}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-l-none"
                        onClick={() => setFormData({ ...formData, preWeight: Math.min(150, formData.preWeight + 1) })}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentWeight">Current Weight (kg)</Label>
                    <div className="flex">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-r-none"
                        onClick={() => setFormData({ ...formData, currentWeight: Math.max(40, formData.currentWeight - 1) })}
                      >
                        -
                      </Button>
                      <Input
                        id="currentWeight"
                        type="number"
                        className="rounded-none text-center"
                        value={formData.currentWeight}
                        onChange={(e) => setFormData({ ...formData, currentWeight: parseInt(e.target.value) || 60 })}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-l-none"
                        onClick={() => setFormData({ ...formData, currentWeight: Math.min(150, formData.currentWeight + 1) })}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select
                      value={formData.bloodGroup}
                      onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Blood Group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <Label>Pre-existing Medical Conditions</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {medicalConditions.map((condition) => (
                        <div key={condition} className="flex items-center space-x-2">
                          <Checkbox
                            id={`condition-${condition}`}
                            checked={formData.preexistingConditions.includes(condition)}
                            onCheckedChange={() => handlePreexistingConditionsChange(condition)}
                          />
                          <Label htmlFor={`condition-${condition}`} className="cursor-pointer">
                            {condition}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  {formData.preexistingConditions.includes("Other") && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="otherCondition">Specify Other Condition</Label>
                      <Input
                        id="otherCondition"
                        placeholder="Please specify your condition"
                        value={formData.otherCondition}
                        onChange={(e) => setFormData({ ...formData, otherCondition: e.target.value })}
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-8">
                  <Button type="button" variant="outline" onClick={prevTab}>
                    Previous
                  </Button>
                  <Button type="button" onClick={nextTab} className="materna-button">
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Pregnancy Information Tab */}
            <TabsContent value="pregnancy">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="lmp">Last Menstrual Period</Label>
                    <Input
                      id="lmp"
                      type="date"
                      required
                      value={formData.lmp}
                      onChange={handleLMPChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Estimated Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primaryProvider">Primary Healthcare Provider</Label>
                    <Input
                      id="primaryProvider"
                      placeholder="Primary Healthcare Provider"
                      value={formData.primaryProvider}
                      onChange={(e) => setFormData({ ...formData, primaryProvider: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredHospital">Preferred Hospital for Delivery</Label>
                    <Input
                      id="preferredHospital"
                      placeholder="Preferred Hospital"
                      value={formData.preferredHospital}
                      onChange={(e) => setFormData({ ...formData, preferredHospital: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gravida">Gravida (Number of Pregnancies)</Label>
                    <div className="flex">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-r-none"
                        onClick={() => setFormData({ ...formData, gravida: Math.max(1, formData.gravida - 1) })}
                      >
                        -
                      </Button>
                      <Input
                        id="gravida"
                        type="number"
                        className="rounded-none text-center"
                        value={formData.gravida}
                        onChange={(e) => setFormData({ ...formData, gravida: parseInt(e.target.value) || 1 })}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-l-none"
                        onClick={() => setFormData({ ...formData, gravida: formData.gravida + 1 })}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="para">Para (Number of Births)</Label>
                    <div className="flex">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-r-none"
                        onClick={() => setFormData({ ...formData, para: Math.max(0, formData.para - 1) })}
                      >
                        -
                      </Button>
                      <Input
                        id="para"
                        type="number"
                        className="rounded-none text-center"
                        value={formData.para}
                        onChange={(e) => setFormData({ ...formData, para: parseInt(e.target.value) || 0 })}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-l-none"
                        onClick={() => setFormData({ ...formData, para: formData.para + 1 })}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-8">
                  <Button type="button" variant="outline" onClick={prevTab}>
                    Previous
                  </Button>
                  <Button type="submit" className="materna-button">
                    {isEditing ? "Update Profile" : "Register"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </Layout>
  );
};

export default RegisterPage;