
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, addDays, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generatePatientId(firstName: string, lastName: string): string {
  const prefix = `${firstName.substring(0, 2)}${lastName.substring(0, 2)}`.toLowerCase();
  const timestamp = new Date().getTime().toString().slice(-6);
  return `${prefix}_${timestamp}`;
}

export function calculateDueDate(lmpDate: Date): Date {
  return addDays(lmpDate, 280); // 40 weeks
}

export function calculateGestationalAge(lmpDate: Date): { weeks: number; days: number } {
  const today = new Date();
  const totalDays = differenceInDays(today, lmpDate);
  
  if (totalDays < 0) return { weeks: 0, days: 0 };
  
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  
  return { weeks, days };
}

export function getTrimester(lmpDate: Date): number {
  const { weeks } = calculateGestationalAge(lmpDate);
  
  if (weeks < 13) return 1;
  if (weeks < 27) return 2;
  return 3;
}

export function daysUntilDueDate(dueDate: Date): number {
  return differenceInDays(dueDate, new Date());
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'yyyy-MM-dd');
}

export function calculatePregnancyProgress(lmpDate: Date): number {
  const totalPregnancyDays = 280; // 40 weeks
  const { weeks, days } = calculateGestationalAge(lmpDate);
  const currentDays = (weeks * 7) + days;
  
  return Math.min(Math.round((currentDays / totalPregnancyDays) * 100), 100);
}

export function getMedicalConditionsList(): string[] {
  return [
    "None",
    "Hypertension",
    "Diabetes",
    "Thyroid Disorder",
    "Asthma",
    "Heart Disease",
    "Kidney Disease",
    "Autoimmune Disorder",
    "Mental Health Condition",
    "Other"
  ];
}

export function uploadFile(file: File): Promise<string> {
  // In a real app, this would upload to a server
  return new Promise((resolve) => {
    setTimeout(() => {
      // Create an object URL for local testing
      const url = URL.createObjectURL(file);
      resolve(url);
    }, 1000);
  });
}
