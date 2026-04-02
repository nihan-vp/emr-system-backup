import { ClinicState } from '../models/ClinicState.js';

export const defaultClinicState = {
  appointments: [
    { id: 101, name: 'Sarah Jenkins', mobile: '9876543210', email: 'sarah.j@example.com', time: '10:00 AM', date: 'Feb 16', notes: 'General Checkup', status: 'upcoming', blood: 'A+' },
    { id: 102, name: 'Mike Ross', mobile: '9988776655', email: 'mike.ross@law.com', time: '11:30 AM', date: 'Feb 16', notes: 'Dental Cleaning', status: 'upcoming', blood: 'O-' },
    { id: 103, name: 'Harvey Specter', mobile: '9123456789', email: 'harvey@specter.com', time: '02:00 PM', date: 'Feb 17', notes: 'Consultation', status: 'pending', blood: 'AB+' },
    { id: 104, name: 'Jessica Pearson', mobile: '9123456000', email: 'jessica@firm.com', time: '09:00 AM', date: 'Feb 10', notes: 'Annual Review', status: 'lastWeek', blood: 'A-' }
  ],
  patients: [
    { id: 101, name: 'Sarah Jenkins', mobile: '9876543210', email: 'sarah.j@example.com', age: '28', dob: '1996-01-10', gender: 'F', blood: 'A+', address: 'New York, NY', registeredDate: 'Jan 10, 2024', vitalsHistory: [{ id: 1, date: new Date().toISOString(), sys: '120', dia: '80', pulse: '72', weight: '65', temp: '36.6', tempUnit: 'C' }], rxHistory: [] },
    { id: 102, name: 'Mike Ross', mobile: '9988776655', email: 'mike.ross@law.com', age: '35', dob: '1989-02-01', gender: 'M', blood: 'O-', address: 'Brooklyn, NY', registeredDate: 'Feb 01, 2024', vitalsHistory: [], rxHistory: [] },
    { id: 822, name: 'Suhaim', mobile: '8891479505', email: 'suhaim@example.com', age: '18', dob: '2006-05-15', gender: 'M', blood: 'O+', address: 'Pathappiriyam', registeredDate: 'Feb 19, 2026', vitalsHistory: [], rxHistory: [] }
  ],
  medicines: [
    { id: 1, name: 'CEFGLOBE- S FORTE 1.5 G', type: 'Injection', content: 'Cefoperazone 1G + Sulbactam 0.5G' },
    { id: 2, name: 'Paracetamol', type: 'Tablet', content: '500mg' },
    { id: 3, name: 'Amoxicillin', type: 'Capsule', content: '250mg' },
    { id: 4, name: 'Ibuprofen', type: 'Syrup', content: '100mg/5ml' },
    { id: 5, name: 'Insulin', type: 'Injection', content: '100IU' }
  ],
  templates: [
    {
      id: 1,
      name: 'Viral Fever Protocol',
      diagnosis: 'Viral Pyrexia',
      advice: 'Drink plenty of fluids (3L/day). Complete bed rest.',
      medicines: [
        { id: 1, name: 'Paracetamol', dosage: '1 Tablet (500mg)', freq: '1-1-1', duration: '3 Days', instruction: 'After Food', type: 'Tablet' },
        { id: 2, name: 'Vitamin C', dosage: '1 Tablet (500mg)', freq: '1-0-0', duration: '5 Days', instruction: 'After Food', type: 'Tablet' }
      ],
      procedures: [],
      nextVisitInvestigations: [],
      referral: ''
    }
  ],
  procedures: [
    { id: 1, name: 'General Consultation', cost: '500', duration: '15 min', category: 'General', notes: 'Standard physician checkup', date: new Date().toISOString() },
    { id: 2, name: 'Root Canal Treatment', cost: '4500', duration: '60 min', category: 'Dental', notes: 'Requires anesthesia', date: new Date().toISOString() },
    { id: 3, name: 'Blood Sugar (FBS/PP)', cost: '150', duration: '10 min', category: 'Lab', notes: 'Fasting required for FBS', date: new Date(Date.now() - 86400000).toISOString() },
    { id: 4, name: 'E.C.G.', cost: '300', duration: '15 min', category: 'Lab', notes: 'Electrocardiogram', date: new Date(Date.now() - 172800000).toISOString() },
    { id: 5, name: 'Wound Dressing', cost: '250', duration: '20 min', category: 'General', notes: 'Includes consumables', date: new Date().toISOString() }
  ]
};

export const ensureClinicState = async () => {
  let existingState = await ClinicState.findOne({ stateKey: 'primary' }).lean();

  if (!existingState) {
    const createdState = await ClinicState.create({
      stateKey: 'primary',
      ...defaultClinicState
    });

    existingState = createdState.toObject();
  }

  return existingState;
};

export const resetClinicState = async () => {
  const updatedState = await ClinicState.findOneAndUpdate(
    { stateKey: 'primary' },
    {
      stateKey: 'primary',
      ...defaultClinicState
    },
    {
      new: true,
      upsert: true,
      overwrite: true,
      setDefaultsOnInsert: true
    }
  );

  return updatedState.toObject();
};