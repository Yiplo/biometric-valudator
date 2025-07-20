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
    // Create multiple admin users
    const adminPassword = await bcrypt.hash("Keylog100$", 10);
    const adminUsers = [
      { username: "admin", displayName: "Administrador Principal", allowedIPs: [] },
      { username: "admin1", displayName: "Administrador 1", allowedIPs: [] },
      { username: "admin2", displayName: "Administrador 2", allowedIPs: [] },
      { username: "admin3", displayName: "Administrador 3", allowedIPs: [] },
      { 
        username: "admin4", 
        displayName: "Administrador 4", 
        allowedIPs: []
      }
    ];

    for (const admin of adminUsers) {
      const adminUser: User = {
        id: this.currentUserId++,
        username: admin.username,
        password: adminPassword,
        allowedIPs: admin.allowedIPs
      };
      this.users.set(adminUser.id, adminUser);
    }

    // Create sample electoral records organized by Mexican states
    const sampleRecords: Omit<ElectoralRegistry, 'id' | 'createdAt'>[] = [
      // Aguascalientes
      {
        curp: "AGUÍ901015HAGRRL01",
        fullName: "RAFAEL AGUILAR TORRES",
        ineNumber: "1001234567890",
        rfc: "AUTR901015A12",
        state: "Aguascalientes",
        fingerprintData: "FP_AGS_001",
        status: "active"
      },
      {
        curp: "HERJ850722MAGRRS08",
        fullName: "JULIA HERNÁNDEZ RODRÍGUEZ",
        ineNumber: "1001234567891",
        rfc: "HERJ850722M34",
        state: "Aguascalientes",
        fingerprintData: "FP_AGS_002",
        status: "active"
      },
      // Baja California
      {
        curp: "LOSM920715HBCNPR08",
        fullName: "MARIO LÓPEZ SÁNCHEZ",
        ineNumber: "0201234567890",
        rfc: "LOSM920715H87",
        state: "Baja California",
        fingerprintData: "FP_BC_001",
        status: "active"
      },
      {
        curp: "GARC880523MBCNRR05",
        fullName: "CARLA GARCÍA RIVERA",
        ineNumber: "0201234567891",
        rfc: "GARC880523M76",
        state: "Baja California",
        fingerprintData: "FP_BC_002",
        status: "active"
      },
      // Baja California Sur
      {
        curp: "MARR950612HBCSRN03",
        fullName: "RICARDO MARTÍNEZ RUIZ",
        ineNumber: "0301234567890",
        rfc: "MARR950612H54",
        state: "Baja California Sur",
        fingerprintData: "FP_BCS_001",
        status: "active"
      },
      {
        curp: "GONZ901208MBCSRN02",
        fullName: "SANDRA GONZÁLEZ NÚÑEZ",
        ineNumber: "0301234567891",
        rfc: "GONZ901208M43",
        state: "Baja California Sur",
        fingerprintData: "FP_BCS_002",
        status: "active"
      },
      // Campeche
      {
        curp: "PERF850315HCMPRL04",
        fullName: "FERNANDO PÉREZ RUIZ",
        ineNumber: "0401234567890",
        rfc: "PERF850315H21",
        state: "Campeche",
        fingerprintData: "FP_CAM_001",
        status: "active"
      },
      {
        curp: "RODM920715MCMPRL08",
        fullName: "MARTHA RODRÍGUEZ LÓPEZ",
        ineNumber: "0401234567891",
        rfc: "RODM920715M87",
        state: "Campeche",
        fingerprintData: "FP_CAM_002",
        status: "active"
      },
      // Chiapas
      {
        curp: "VAZJ880523HCHPZR05",
        fullName: "JOSÉ VÁZQUEZ ZARATE",
        ineNumber: "0701234567890",
        rfc: "VAZJ880523H76",
        state: "Chiapas",
        fingerprintData: "FP_CHP_001",
        status: "active"
      },
      {
        curp: "CRUZ950612MCHPRZ03",
        fullName: "ROSA CRUZ ZAPATA",
        ineNumber: "0701234567891",
        rfc: "CRUZ950612M54",
        state: "Chiapas",
        fingerprintData: "FP_CHP_002",
        status: "active"
      },
      // Chihuahua
      {
        curp: "SANT901208HCHHNT02",
        fullName: "ANTONIO SANTOS HERNÁNDEZ",
        ineNumber: "0801234567890",
        rfc: "SANT901208H43",
        state: "Chihuahua",
        fingerprintData: "FP_CHH_001",
        status: "active"
      },
      {
        curp: "VARG850315MCHHRL04",
        fullName: "GLORIA VARGAS HERRERA",
        ineNumber: "0801234567891",
        rfc: "VARG850315M21",
        state: "Chihuahua",
        fingerprintData: "FP_CHH_002",
        status: "active"
      },
      // Ciudad de México
      {
        curp: "JIMR920715HDFMRR08",
        fullName: "RODRIGO JIMÉNEZ MORALES",
        ineNumber: "0901234567890",
        rfc: "JIMR920715H87",
        state: "Ciudad de México",
        fingerprintData: "FP_CDMX_001",
        status: "active"
      },
      {
        curp: "MORA880523MDFRLR05",
        fullName: "ALEJANDRA MORALES RIVERA",
        ineNumber: "0901234567891",
        rfc: "MORA880523M76",
        state: "Ciudad de México",
        fingerprintData: "FP_CDMX_002",
        status: "active"
      },
      // Coahuila
      {
        curp: "HERR950612HCOHRD03",
        fullName: "DIEGO HERRERA RAMOS",
        ineNumber: "0501234567890",
        rfc: "HERR950612H54",
        state: "Coahuila",
        fingerprintData: "FP_COA_001",
        status: "active"
      },
      {
        curp: "LUNE901208MCOHLR02",
        fullName: "ESPERANZA LUNA ESCOBAR",
        ineNumber: "0501234567891",
        rfc: "LUNE901208M43",
        state: "Coahuila",
        fingerprintData: "FP_COA_002",
        status: "active"
      },
      // Colima
      {
        curp: "MEND850315HCOLRN04",
        fullName: "NORBERTO MÉNDEZ DÍAZ",
        ineNumber: "0601234567890",
        rfc: "MEND850315H21",
        state: "Colima",
        fingerprintData: "FP_COL_001",
        status: "active"
      },
      {
        curp: "CAST920715MCOLST08",
        fullName: "TERESA CASTILLO SANTOS",
        ineNumber: "0601234567891",
        rfc: "CAST920715M87",
        state: "Colima",
        fingerprintData: "FP_COL_002",
        status: "active"
      },
      // Durango
      {
        curp: "GARJ880523HDRGRR05",
        fullName: "JAVIER GARCÍA GUERRERO",
        ineNumber: "1001234567890",
        rfc: "GARJ880523H76",
        state: "Durango",
        fingerprintData: "FP_DUR_001",
        status: "active"
      },
      {
        curp: "RAMI950612MDRGMR03",
        fullName: "IRMA RAMÍREZ GÓMEZ",
        ineNumber: "1001234567891",
        rfc: "RAMI950612M54",
        state: "Durango",
        fingerprintData: "FP_DUR_002",
        status: "active"
      },
      // Guanajuato
      {
        curp: "ORTL901208HGTRRD02",
        fullName: "LUIS ORTIZ HERRERA",
        ineNumber: "1101234567890",
        rfc: "ORTL901208H43",
        state: "Guanajuato",
        fingerprintData: "FP_GTO_001",
        status: "active"
      },
      {
        curp: "FLOW850315MGTRWR04",
        fullName: "WENDY FLORES ORTIZ",
        ineNumber: "1101234567891",
        rfc: "FLOW850315M21",
        state: "Guanajuato",
        fingerprintData: "FP_GTO_002",
        status: "active"
      },
      // Guerrero
      {
        curp: "DELR920715HGRRLN08",
        fullName: "RUBÉN DELGADO LEÓN",
        ineNumber: "1201234567890",
        rfc: "DELR920715H87",
        state: "Guerrero",
        fingerprintData: "FP_GRO_001",
        status: "active"
      },
      {
        curp: "AGUI880523MGRGLR05",
        fullName: "LORENA AGUILAR IBARRA",
        ineNumber: "1201234567891",
        rfc: "AGUI880523M76",
        state: "Guerrero",
        fingerprintData: "FP_GRO_002",
        status: "active"
      },
      // Hidalgo
      {
        curp: "SOLM950612HHDGLR03",
        fullName: "MIGUEL SOLIS GALVÁN",
        ineNumber: "1301234567890",
        rfc: "SOLM950612H54",
        state: "Hidalgo",
        fingerprintData: "FP_HGO_001",
        status: "active"
      },
      {
        curp: "BAUT901208MHDLTR02",
        fullName: "RUTH BAUTISTA TORRES",
        ineNumber: "1301234567891",
        rfc: "BAUT901208M43",
        state: "Hidalgo",
        fingerprintData: "FP_HGO_002",
        status: "active"
      },
      // Jalisco
      {
        curp: "CERR850315HJCLRR04",
        fullName: "RAFAEL CERVANTES RUIZ",
        ineNumber: "1401234567890",
        rfc: "CERR850315H21",
        state: "Jalisco",
        fingerprintData: "FP_JAL_001",
        status: "active"
      },
      {
        curp: "NUÑP920715MJCLPR08",
        fullName: "PATRICIA NÚÑEZ LÓPEZ",
        ineNumber: "1401234567891",
        rfc: "NUÑP920715M87",
        state: "Jalisco",
        fingerprintData: "FP_JAL_002",
        status: "active"
      },
      // México
      {
        curp: "RIVS880523HMEXVR05",
        fullName: "SERGIO RIVERA VEGA",
        ineNumber: "1501234567890",
        rfc: "RIVS880523H76",
        state: "México",
        fingerprintData: "FP_MEX_001",
        status: "active"
      },
      {
        curp: "TORV950612MMEXRL03",
        fullName: "VIVIANA TORRES REYES",
        ineNumber: "1501234567891",
        rfc: "TORV950612M54",
        state: "México",
        fingerprintData: "FP_MEX_002",
        status: "active"
      },
      // Michoacán
      {
        curp: "GUZD901208HMCHZR02",
        fullName: "DAVID GUZMÁN ZAVALA",
        ineNumber: "1601234567890",
        rfc: "GUZD901208H43",
        state: "Michoacán",
        fingerprintData: "FP_MICH_001",
        status: "active"
      },
      {
        curp: "SALX850315MMCHXL04",
        fullName: "XIMENA SALAZAR LÓPEZ",
        ineNumber: "1601234567891",
        rfc: "SALX850315M21",
        state: "Michoacán",
        fingerprintData: "FP_MICH_002",
        status: "active"
      },
      // Morelos
      {
        curp: "CABF920715HMORBRR08",
        fullName: "FERNANDO CABRERA BRAVO",
        ineNumber: "1701234567890",
        rfc: "CABF920715H87",
        state: "Morelos",
        fingerprintData: "FP_MOR_001",
        status: "active"
      },
      {
        curp: "GARYU880523MMORRR05",
        fullName: "YURIDIA GARCÍA HERRERA",
        ineNumber: "1701234567891",
        rfc: "GARY880523M76",
        state: "Morelos",
        fingerprintData: "FP_MOR_002",
        status: "active"
      },
      // Nayarit
      {
        curp: "MONJ950612HNAYND03",
        fullName: "JORGE MONTOYA NAVARRO",
        ineNumber: "1801234567890",
        rfc: "MONJ950612H54",
        state: "Nayarit",
        fingerprintData: "FP_NAY_001",
        status: "active"
      },
      {
        curp: "IBAZ901208MNAYBR02",
        fullName: "ZAIRA IBARRA BRIONES",
        ineNumber: "1801234567891",
        rfc: "IBAZ901208M43",
        state: "Nayarit",
        fingerprintData: "FP_NAY_002",
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