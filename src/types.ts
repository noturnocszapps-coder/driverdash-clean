export type PlatformType = 
  | 'uber_car' 
  | 'noventanove_car' 
  | 'indrive_car' 
  | 'uber_moto' 
  | 'noventanove_moto' 
  | 'indrive_moto' 
  | 'ifood' 
  | 'shopee' 
  | 'mercadolivre';

export type TransportMode = 'car' | 'motorcycle' | 'bicycle' | 'scooter' | 'walking';

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

export interface WorkLog {
  id: string;
  user_id: string;
  platform_type: PlatformType;
  date: string;
  gross_amount: number;
  passenger_cash_amount: number;
  tips_amount: number;
  bonus_amount: number;
  hours_worked: number;
  km_driven: number;
  deliveries_count?: number;
  rides_count?: number;
  packages_count?: number;
  routes_count?: number;
  vehicle_type?: 'Passeio' | 'Fiorino';
  extra_expenses?: number;
  shopee_km_bracket?: string;
  notes?: string;
  created_at?: string;
}

export interface UserWorkProfile {
  id: string;
  user_id: string;
  platform_type: PlatformType;
  active: boolean;
  created_at: string;
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
  activePlatforms: PlatformType[];
  transportMode: TransportMode;
  dashboardMode: 'merged' | 'segmented';
}

export interface TrackingSession {
  isActive: boolean;
  startTime?: number;
  distance: number;
  avgSpeed: number;
  duration: number;
}

export type SyncStatus = 'idle' | 'online' | 'offline' | 'syncing' | 'synced';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface FaturamentoLog {
  id: string;
  user_id: string;
  date: string;
  vehicle_mode: 'carro' | 'moto';
  uber_amount: number;
  noventanove_amount: number;
  indriver_amount: number;
  extra_amount: number;
  km_total: number;
  active_hours_total: number;
  fuel_total: number;
  fuel_price: number;
  fuel_type: 'gasolina' | 'etanol' | 'energia';
  additional_expense: number;
  notes?: string;
  created_at?: string;
}

export interface DriverState {
  user: AuthUser | null;
  syncStatus: SyncStatus;
  rides: Ride[];
  workLogs: WorkLog[];
  faturamentoLogs: FaturamentoLog[];
  expenses: Expense[];
  fuelings: Fueling[];
  maintenances: Maintenance[];
  settings: UserSettings;
  tracking: TrackingSession;
  setUser: (user: AuthUser | null) => void;
  setSyncStatus: (status: SyncStatus) => void;
  addRide: (ride: Omit<Ride, 'id'>) => void;
  addWorkLog: (log: Omit<WorkLog, 'id' | 'user_id'>) => void;
  addFaturamentoLog: (log: Omit<FaturamentoLog, 'id' | 'user_id'>) => void;
  updateFaturamentoLog: (id: string, log: Partial<FaturamentoLog>) => void;
  deleteWorkLog: (id: string) => void;
  deleteRide: (id: string) => void;
  deleteFaturamentoLog: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  addFueling: (fueling: Omit<Fueling, 'id'>) => void;
  addMaintenance: (maintenance: Omit<Maintenance, 'id'>) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateTracking: (tracking: Partial<TrackingSession>) => void;
  importData: (data: { rides?: Ride[], workLogs?: WorkLog[], faturamentoLogs?: FaturamentoLog[], expenses?: Expense[], fuelings?: Fueling[], maintenances?: Maintenance[], settings?: Partial<UserSettings> }) => void;
  syncData: () => Promise<void>;
  clearData: () => void;
  clearCloudData: () => Promise<{ success: boolean; error?: any }>;
}
