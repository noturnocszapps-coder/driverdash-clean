export type AppType = 'Uber' | '99' | 'Particular';

export type ExpenseCategory = 
  | 'combustível' 
  | 'manutenção' 
  | 'seguro' 
  | 'alimentação' 
  | 'lavagem' 
  | 'aluguel/parcela' 
  | 'IPVA' 
  | 'outros';

export interface Ride {
  id: string;
  date: string;
  app: AppType;
  grossValue: number;
  tips: number;
  bonus: number;
  onlineHours: number;
  kmDriven: number;
  passengerPaid?: number;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  value: number;
}

export interface Fueling {
  id: string;
  date: string;
  liters: number;
  value: number;
  odometer: number;
}

export interface Maintenance {
  id: string;
  date: string;
  type: string;
  value: number;
  currentKm: number;
  nextChangeKm: number;
}

export interface VehicleCosts {
  purchaseValue: number;
  insurance: number;
  ipva: number;
  licensing: number;
  depreciation: number;
  monthlyMaintenance: number;
  annualKm: number;
}

export interface UserSettings {
  dailyGoal: number;
  name: string;
  vehicle: string;
  kmPerLiter?: number;
  fuelPrice?: number;
  vehicleCosts?: VehicleCosts;
  avgRideValue?: number;
  avgRideKm?: number;
}

export interface TrackingSession {
  isActive: boolean;
  startTime?: number;
  distance: number;
  avgSpeed: number;
  duration: number;
}

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'synced';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface DriverState {
  user: AuthUser | null;
  syncStatus: SyncStatus;
  rides: Ride[];
  expenses: Expense[];
  fuelings: Fueling[];
  maintenances: Maintenance[];
  settings: UserSettings;
  tracking: TrackingSession;
  setUser: (user: AuthUser | null) => void;
  setSyncStatus: (status: SyncStatus) => void;
  addRide: (ride: Omit<Ride, 'id'>) => void;
  deleteRide: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  addFueling: (fueling: Omit<Fueling, 'id'>) => void;
  addMaintenance: (maintenance: Omit<Maintenance, 'id'>) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateTracking: (tracking: Partial<TrackingSession>) => void;
  importData: (data: { rides?: Ride[], expenses?: Expense[], fuelings?: Fueling[], maintenances?: Maintenance[], settings?: UserSettings }) => void;
  clearData: () => void;
}
