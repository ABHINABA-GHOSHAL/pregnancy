
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { toast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const BookAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { isRegistered, patientData } = useApp();
  const [date, setDate] = useState<Date>();
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentType, setAppointmentType] = useState("check-up");
  const [doctor, setDoctor] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingComplete, setBookingComplete] = useState(false);

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !appointmentTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time for your appointment.",
        variant: "destructive"
      });
      return;
    }
    
    // Simulate booking success
    setTimeout(() => {
      toast({
        title: "Appointment Booked",
        description: `Your appointment has been scheduled for ${format(date, "MMMM dd, yyyy")} at ${appointmentTime}.`
      });
      
      setBookingComplete(true);
    }, 1000);
  };

  const timeSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
    "04:00 PM", "04:30 PM"
  ];

  if (bookingComplete) {
    return (
      <Layout>
        <div className="container mx-auto py-16 px-4 md:px-6 max-w-3xl">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-center">Appointment Booked Successfully!</CardTitle>
              <CardDescription className="text-center">
                Your appointment details have been confirmed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-lg p-6 space-y-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{date ? format(date, "MMMM dd, yyyy") : "Not selected"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">{appointmentTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Appointment Type</p>
                    <p className="font-medium">
                      {appointmentType === "check-up" ? "Regular Check-up" : 
                       appointmentType === "ultrasound" ? "Ultrasound Scan" :
                       appointmentType === "blood-work" ? "Blood Work" :
                       appointmentType === "consultation" ? "Doctor Consultation" : "Other"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Doctor</p>
                    <p className="font-medium">{doctor || "Any Available Doctor"}</p>
                  </div>
                </div>
                {notes && (
                  <div>
                    <p className="text-sm text-gray-500">Additional Notes</p>
                    <p className="text-sm mt-1">{notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <p className="text-center text-gray-600">
                  You will receive a confirmation email with these details shortly.
                </p>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => navigate("/")}>
                    Return Home
                  </Button>
                  <Button className="materna-button" onClick={() => setBookingComplete(false)}>
                    Book Another Appointment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 animate-fade-in">
        <h1 className="text-3xl font-bold mb-8">Book an Appointment</h1>
        
        <div className="max-w-3xl mx-auto">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Schedule Your Prenatal Appointment</CardTitle>
              <CardDescription>
                Select your preferred date, time, and appointment type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBookAppointment} className="space-y-6">
                {isRegistered && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <h3 className="font-medium mb-2">Patient Information</h3>
                    <p>Name: {patientData.firstName} {patientData.lastName}</p>
                    <p>ID: {patientData.id}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="date">Appointment Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : "Select a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          disabled={(date) => 
                            date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                            date.getDay() === 0 || // Sunday
                            date.getDay() === 6 // Saturday
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time">Appointment Time</Label>
                    <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Appointment Type</Label>
                    <Select value={appointmentType} onValueChange={setAppointmentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select appointment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="check-up">Regular Check-up</SelectItem>
                        <SelectItem value="ultrasound">Ultrasound Scan</SelectItem>
                        <SelectItem value="blood-work">Blood Work</SelectItem>
                        <SelectItem value="consultation">Doctor Consultation</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="doctor">Preferred Doctor (optional)</Label>
                    <Input
                      id="doctor"
                      placeholder="Enter doctor's name"
                      value={doctor}
                      onChange={(e) => setDoctor(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any specific concerns or information you'd like to share"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                
                {!isRegistered && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md">
                    <p className="text-yellow-700">
                      You're booking as a guest. For a complete experience, we recommend 
                      <Button variant="link" className="px-1 text-materna-600" onClick={() => navigate("/register")}>
                        registering for an account
                      </Button>.
                    </p>
                  </div>
                )}
                
                <Button type="submit" className="materna-button w-full">
                  Book Appointment
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default BookAppointmentPage;
