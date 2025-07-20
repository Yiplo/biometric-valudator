import { 
  users, 
  electoralRegistry, 
  validationHistory, 
  institutions,
  type User, 
  type InsertUser,
  type ElectoralRegistry,
  type InsertElectoralRegistry,
  type ValidationHistory,
  type InsertValidationHistory,
  type Institution,
  type InsertInstitution
} from "@shared/schema";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUser(username: string, password: string): Promise<User | null>;

  // Electoral registry methods
  getElectoralRecord(id: number): Promise<ElectoralRegistry | undefined>;
  getElectoralRecordByCurp(curp: string): Promise<ElectoralRegistry | undefined>;
  getElectoralRecordByIne(ineNumber: string): Promise<ElectoralRegistry | undefined>;
  getElectoralRecordByRfc(rfc: string): Promise<ElectoralRegistry | undefined>;
  getAllElectoralRecords(): Promise<ElectoralRegistry[]>;
  createElectoralRecord(record: InsertElectoralRegistry): Promise<ElectoralRegistry>;
  updateElectoralRecord(id: number, record: Partial<InsertElectoralRegistry>): Promise<ElectoralRegistry | undefined>;
  deleteElectoralRecord(id: number): Promise<boolean>;

  // Validation history methods
  createValidationHistory(validation: InsertValidationHistory): Promise<ValidationHistory>;
  getValidationHistory(): Promise<ValidationHistory[]>;
  getValidationHistoryByInstitution(institution: string): Promise<ValidationHistory[]>;

  // Institution methods
  getInstitutionByApiKey(apiKey: string): Promise<Institution | undefined>;
  getAllInstitutions(): Promise<Institution[]>;
  createInstitution(institution: InsertInstitution): Promise<Institution>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private electoralRecords: Map<number, ElectoralRegistry>;
  private validationHistoryRecords: Map<number, ValidationHistory>;
  private institutionsMap: Map<number, Institution>;
  private currentUserId: number;
  private currentElectoralId: number;
  private currentValidationId: number;
  private currentInstitutionId: number;

  constructor() {
    this.users = new Map();
    this.electoralRecords = new Map();
    this.validationHistoryRecords = new Map();
    this.institutionsMap = new Map();
    this.currentUserId = 1;
    this.currentElectoralId = 1;
    this.currentValidationId = 1;
    this.currentInstitutionId = 1;
    
    this.initializeData();
  }

  private async initializeData() {
    // Create admin user
    const adminPassword = await bcrypt.hash("Keylog100$", 10);
    const adminUser: User = {
      id: this.currentUserId++,
      username: "admin",
      password: adminPassword
    };
    this.users.set(adminUser.id, adminUser);

    // Create sample electoral records with more realistic fingerprint data
    const sampleRecords: Omit<ElectoralRegistry, 'id' | 'createdAt'>[] = [
      {
        curp: "LOSM920715MDFPPR08",
        fullName: "MARÍA FERNANDA LÓPEZ SÁNCHEZ",
        ineNumber: "9876543210987",
        rfc: "LOSM920715M87",
        fingerprintData: "FP_LOSM920715_A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4",
        status: "active"
      },
      {
        curp: "MARC880523HDFTRR05",
        fullName: "CARLOS EDUARDO MARTÍNEZ RUIZ",
        ineNumber: "5432167890543",
        rfc: "MARC880523H76",
        fingerprintData: "FP_MARC880523_B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5",
        status: "active"
      },
      {
        curp: "GAHA950612MDFRNN03",
        fullName: "ANA PATRICIA GARCÍA HERNÁNDEZ",
        ineNumber: "1357924680135",
        rfc: "GAHA950612M54",
        fingerprintData: "FP_GAHA950612_C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6",
        status: "inactive"
      },
      {
        curp: "PEMJ901208HDFRZN02",
        fullName: "JUAN CARLOS PÉREZ MÉNDEZ", 
        ineNumber: "2468013579246",
        rfc: "PEMJ901208H43",
        fingerprintData: "FP_PEMJ901208_D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7",
        status: "active"
      },
      {
        curp: "ROGR850315MDFMRL04",
        fullName: "ROSA MARÍA RODRÍGUEZ GÓMEZ",
        ineNumber: "8642097531864",
        rfc: "ROGR850315M21",
        fingerprintData: "FP_ROGR850315_E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8",
        status: "active"
      }
    ];

    for (const record of sampleRecords) {
      const electoralRecord: ElectoralRegistry = {
        ...record,
        id: this.currentElectoralId++,
        createdAt: new Date(),
        status: record.status || "active",
        rfc: record.rfc || null
      };
      this.electoralRecords.set(electoralRecord.id, electoralRecord);
    }

    // Create sample institutions
    const sampleInstitutions: Omit<Institution, 'id'>[] = [
      { name: "BANCO_AZTECA", apiKey: "azteca_key_123", active: true },
      { name: "BBVA_MEXICO", apiKey: "bbva_key_456", active: true },
      { name: "SANTANDER_MX", apiKey: "santander_key_789", active: true }
    ];

    for (const institution of sampleInstitutions) {
      const inst: Institution = {
        ...institution,
        id: this.currentInstitutionId++,
        active: institution.active !== undefined ? institution.active : true
      };
      this.institutionsMap.set(inst.id, inst);
    }

    // Create sample validation history
    const sampleHistory: Omit<ValidationHistory, 'id' | 'timestamp'>[] = [
      {
        institution: "BANCO_AZTECA",
        curp: "LOSM920715MDFPPR08",
        matchingPercentage: 94,
        status: "success",
        ipAddress: "192.168.1.101"
      },
      {
        institution: "BBVA_MEXICO",
        curp: "MARC880523HDFTRR05",
        matchingPercentage: 87,
        status: "success",
        ipAddress: "10.0.2.45"
      },
      {
        institution: "SANTANDER_MX",
        curp: "GAHA950612MDFRNN03",
        matchingPercentage: 42,
        status: "failed",
        ipAddress: "172.16.0.23"
      }
    ];

    for (const history of sampleHistory) {
      const historyRecord: ValidationHistory = {
        ...history,
        id: this.currentValidationId++,
        timestamp: new Date(),
        ipAddress: history.ipAddress || null
      };
      this.validationHistoryRecords.set(historyRecord.id, historyRecord);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      ...insertUser,
      password: hashedPassword,
      id: this.currentUserId++
    };
    this.users.set(user.id, user);
    return user;
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Electoral registry methods
  async getElectoralRecord(id: number): Promise<ElectoralRegistry | undefined> {
    return this.electoralRecords.get(id);
  }

  async getElectoralRecordByCurp(curp: string): Promise<ElectoralRegistry | undefined> {
    return Array.from(this.electoralRecords.values()).find(record => record.curp === curp);
  }

  async getElectoralRecordByIne(ineNumber: string): Promise<ElectoralRegistry | undefined> {
    return Array.from(this.electoralRecords.values()).find(record => record.ineNumber === ineNumber);
  }

  async getElectoralRecordByRfc(rfc: string): Promise<ElectoralRegistry | undefined> {
    return Array.from(this.electoralRecords.values()).find(record => record.rfc === rfc);
  }

  async getAllElectoralRecords(): Promise<ElectoralRegistry[]> {
    return Array.from(this.electoralRecords.values());
  }

  async createElectoralRecord(insertRecord: InsertElectoralRegistry): Promise<ElectoralRegistry> {
    const record: ElectoralRegistry = {
      ...insertRecord,
      id: this.currentElectoralId++,
      createdAt: new Date(),
      status: insertRecord.status || "active",
      rfc: insertRecord.rfc || null
    };
    this.electoralRecords.set(record.id, record);
    return record;
  }

  async updateElectoralRecord(id: number, updateData: Partial<InsertElectoralRegistry>): Promise<ElectoralRegistry | undefined> {
    const existing = this.electoralRecords.get(id);
    if (!existing) return undefined;
    
    const updated: ElectoralRegistry = { ...existing, ...updateData };
    this.electoralRecords.set(id, updated);
    return updated;
  }

  async deleteElectoralRecord(id: number): Promise<boolean> {
    return this.electoralRecords.delete(id);
  }

  // Validation history methods
  async createValidationHistory(insertValidation: InsertValidationHistory): Promise<ValidationHistory> {
    const validation: ValidationHistory = {
      ...insertValidation,
      id: this.currentValidationId++,
      timestamp: new Date(),
      ipAddress: insertValidation.ipAddress || null
    };
    this.validationHistoryRecords.set(validation.id, validation);
    return validation;
  }

  async getValidationHistory(): Promise<ValidationHistory[]> {
    return Array.from(this.validationHistoryRecords.values()).sort((a, b) => 
      b.timestamp!.getTime() - a.timestamp!.getTime()
    );
  }

  async getValidationHistoryByInstitution(institution: string): Promise<ValidationHistory[]> {
    return Array.from(this.validationHistoryRecords.values())
      .filter(record => record.institution === institution)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime());
  }

  // Institution methods
  async getInstitutionByApiKey(apiKey: string): Promise<Institution | undefined> {
    return Array.from(this.institutionsMap.values()).find(inst => inst.apiKey === apiKey);
  }

  async getAllInstitutions(): Promise<Institution[]> {
    return Array.from(this.institutionsMap.values());
  }

  async createInstitution(insertInstitution: InsertInstitution): Promise<Institution> {
    const institution: Institution = {
      ...insertInstitution,
      id: this.currentInstitutionId++,
      active: insertInstitution.active !== undefined ? insertInstitution.active : true
    };
    this.institutionsMap.set(institution.id, institution);
    return institution;
  }
}

export const storage = new MemStorage();
