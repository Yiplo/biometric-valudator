import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertElectoralRegistrySchema,
  biometricValidationSchema,
  identityVerificationSchema,
  insertValidationHistorySchema
} from "@shared/schema";
import { z } from "zod";

// Biometric matching simulation
function simulateBiometricMatching(storedFingerprint: string, providedFingerprint: string): number {
  // Simple simulation based on string similarity
  if (storedFingerprint === providedFingerprint) {
    return Math.random() * (98 - 85) + 85; // 85-98% for exact match
  }
  
  // Calculate a pseudo-random but deterministic percentage based on the strings
  const hash1 = storedFingerprint.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const hash2 = providedFingerprint.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const similarity = Math.abs(hash1 - hash2) % 100;
  
  // Return a percentage between 30-85% for non-exact matches
  return Math.max(30, Math.min(85, similarity));
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.validateUser(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check IP restrictions for specific users
      if (user.allowedIPs && user.allowedIPs.length > 0) {
        const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
        const isAllowedIP = user.allowedIPs.some(allowedIP => 
          clientIP === allowedIP || 
          clientIP?.includes(allowedIP) ||
          allowedIP.includes(clientIP || '')
        );
        
        if (!isAllowedIP) {
          console.log(`[AUTH] User '${user.username}' attempted login from unauthorized IP: ${clientIP}`);
          return res.status(403).json({ message: "Access denied from this IP address" });
        }
      }

      // Log successful login
      console.log(`[AUTH] User '${user.username}' logged in successfully from ${req.ip || 'unknown IP'}`);
      
      res.json({ 
        success: true, 
        user: { id: user.id, username: user.username }
      });
    } catch (error) {
      res.status(500).json({ message: "Authentication error" });
    }
  });

  // Biometric validation endpoint
  app.post("/api/biometria/validar", async (req, res) => {
    try {
      const validatedData = biometricValidationSchema.parse(req.body);
      const { curp, fingerprintData } = validatedData;

      // Get the electoral record
      const record = await storage.getElectoralRecordByCurp(curp);
      if (!record) {
        return res.status(404).json({ 
          message: "CURP not found in electoral registry",
          matchingPercentage: 0,
          status: "not_found"
        });
      }

      // Simulate biometric matching
      const matchingPercentage = simulateBiometricMatching(record.fingerprintData, fingerprintData);
      const isMatch = matchingPercentage >= 85; // Threshold for successful match

      // Log validation attempt
      await storage.createValidationHistory({
        institution: req.headers.authorization ? "API_CLIENT" : "WEB_PORTAL",
        curp,
        matchingPercentage: Math.round(matchingPercentage),
        status: isMatch ? "success" : "failed",
        ipAddress: req.ip || req.connection.remoteAddress
      });

      res.json({
        matchingPercentage: Math.round(matchingPercentage * 10) / 10, // Round to 1 decimal
        status: isMatch ? "success" : "failed",
        threshold: 85,
        record: {
          curp: record.curp,
          fullName: record.fullName,
          ineNumber: record.ineNumber,
          rfc: record.rfc,
          status: record.status
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Biometric validation error" });
    }
  });

  // Identity verification endpoint
  app.post("/api/institucion/verificar-identidad", async (req, res) => {
    try {
      const validatedData = identityVerificationSchema.parse(req.body);
      const { identifier, identifierType, fingerprintData } = validatedData;

      let record;
      switch (identifierType) {
        case "curp":
          record = await storage.getElectoralRecordByCurp(identifier);
          break;
        case "ine":
          record = await storage.getElectoralRecordByIne(identifier);
          break;
        case "rfc":
          record = await storage.getElectoralRecordByRfc(identifier);
          break;
        default:
          return res.status(400).json({ message: "Invalid identifier type" });
      }

      if (!record) {
        return res.status(404).json({ 
          message: `${identifierType.toUpperCase()} not found in electoral registry`,
          status: "not_found"
        });
      }

      let biometricResult = null;
      if (fingerprintData) {
        const matchingPercentage = simulateBiometricMatching(record.fingerprintData, fingerprintData);
        const isMatch = matchingPercentage >= 85;
        
        biometricResult = {
          matchingPercentage: Math.round(matchingPercentage * 10) / 10,
          status: isMatch ? "success" : "failed",
          threshold: 85
        };

        // Log validation attempt
        await storage.createValidationHistory({
          institution: req.headers.authorization ? "API_CLIENT" : "WEB_PORTAL",
          curp: record.curp,
          matchingPercentage: Math.round(matchingPercentage),
          status: isMatch ? "success" : "failed",
          ipAddress: req.ip || req.connection.remoteAddress
        });
      }

      res.json({
        found: true,
        record: {
          curp: record.curp,
          fullName: record.fullName,
          ineNumber: record.ineNumber,
          rfc: record.rfc,
          status: record.status
        },
        biometric: biometricResult
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Identity verification error" });
    }
  });

  // Electoral registry endpoints
  app.get("/api/padron", async (req, res) => {
    try {
      const records = await storage.getAllElectoralRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Error fetching electoral registry" });
    }
  });

  app.post("/api/padron", async (req, res) => {
    try {
      const validatedData = insertElectoralRegistrySchema.parse(req.body);
      const record = await storage.createElectoralRecord(validatedData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating electoral record" });
    }
  });

  app.put("/api/padron/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertElectoralRegistrySchema.partial().parse(req.body);
      const record = await storage.updateElectoralRecord(id, validatedData);
      
      if (!record) {
        return res.status(404).json({ message: "Electoral record not found" });
      }
      
      res.json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Error updating electoral record" });
    }
  });

  app.delete("/api/padron/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteElectoralRecord(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Electoral record not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error deleting electoral record" });
    }
  });

  // Validation history endpoint
  app.get("/api/historial", async (req, res) => {
    try {
      const { institution } = req.query;
      
      let history;
      if (institution) {
        history = await storage.getValidationHistoryByInstitution(institution as string);
      } else {
        history = await storage.getValidationHistory();
      }
      
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Error fetching validation history" });
    }
  });

  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const history = await storage.getValidationHistory();
      const totalValidations = history.length;
      const successfulValidations = history.filter(h => h.status === "success").length;
      const failedValidations = totalValidations - successfulValidations;
      const successRate = totalValidations > 0 ? (successfulValidations / totalValidations) * 100 : 0;

      res.json({
        totalValidations,
        successfulValidations,
        failedValidations,
        successRate: Math.round(successRate * 10) / 10
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
