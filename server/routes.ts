import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Narrative routes
  
  // GET /api/narrative/seasons - Get all seasons
  app.get("/api/narrative/seasons", async (req, res) => {
    try {
      const seasons = await storage.getAllSeasons();
      res.json(seasons);
    } catch (error) {
      console.error("Error fetching seasons:", error);
      res.status(500).json({ error: "Failed to fetch seasons" });
    }
  });

  // GET /api/narrative/episodes/:seasonId - Get episodes by season
  app.get("/api/narrative/episodes/:seasonId", async (req, res) => {
    try {
      const seasonId = parseInt(req.params.seasonId);
      if (isNaN(seasonId)) {
        return res.status(400).json({ error: "Invalid season ID" });
      }
      
      const episodes = await storage.getEpisodesBySeason(seasonId);
      res.json(episodes);
    } catch (error) {
      console.error("Error fetching episodes:", error);
      res.status(500).json({ error: "Failed to fetch episodes" });
    }
  });

  // GET /api/narrative/chunks/:episodeId - Get chunks by episode with pagination
  app.get("/api/narrative/chunks/:episodeId", async (req, res) => {
    try {
      const episodeId = parseInt(req.params.episodeId);
      if (isNaN(episodeId)) {
        return res.status(400).json({ error: "Invalid episode ID" });
      }
      
      const offset = parseInt(req.query.offset as string) || 0;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const result = await storage.getChunksByEpisode(episodeId, offset, limit);
      res.json(result);
    } catch (error) {
      console.error("Error fetching chunks:", error);
      res.status(500).json({ error: "Failed to fetch chunks" });
    }
  });

  // Character routes
  
  // GET /api/characters - Get all characters with optional ID range filter
  app.get("/api/characters", async (req, res) => {
    try {
      const startId = req.query.startId ? parseInt(req.query.startId as string) : undefined;
      const endId = req.query.endId ? parseInt(req.query.endId as string) : undefined;
      
      const characters = await storage.getCharacters(startId, endId);
      res.json(characters);
    } catch (error) {
      console.error("Error fetching characters:", error);
      res.status(500).json({ error: "Failed to fetch characters" });
    }
  });

  // GET /api/characters/:id/relationships - Get character relationships
  app.get("/api/characters/:id/relationships", async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      if (isNaN(characterId)) {
        return res.status(400).json({ error: "Invalid character ID" });
      }
      
      const relationships = await storage.getCharacterRelationships(characterId);
      res.json(relationships);
    } catch (error) {
      console.error("Error fetching character relationships:", error);
      res.status(500).json({ error: "Failed to fetch character relationships" });
    }
  });

  // GET /api/characters/:id/psychology - Get character psychology
  app.get("/api/characters/:id/psychology", async (req, res) => {
    try {
      const characterId = parseInt(req.params.id);
      if (isNaN(characterId)) {
        return res.status(400).json({ error: "Invalid character ID" });
      }
      
      const psychology = await storage.getCharacterPsychology(characterId);
      if (!psychology) {
        return res.status(404).json({ error: "Character psychology not found" });
      }
      res.json(psychology);
    } catch (error) {
      console.error("Error fetching character psychology:", error);
      res.status(500).json({ error: "Failed to fetch character psychology" });
    }
  });

  // Place and Zone routes
  
  // GET /api/places - Get all places
  app.get("/api/places", async (req, res) => {
    try {
      const places = await storage.getAllPlaces();
      res.json(places);
    } catch (error) {
      console.error("Error fetching places:", error);
      res.status(500).json({ error: "Failed to fetch places" });
    }
  });

  // GET /api/zones - Get all zones
  app.get("/api/zones", async (req, res) => {
    try {
      const zones = await storage.getAllZones();
      res.json(zones);
    } catch (error) {
      console.error("Error fetching zones:", error);
      res.status(500).json({ error: "Failed to fetch zones" });
    }
  });

  // Additional faction route (for completeness)
  app.get("/api/factions", async (req, res) => {
    try {
      const factions = await storage.getAllFactions();
      res.json(factions);
    } catch (error) {
      console.error("Error fetching factions:", error);
      res.status(500).json({ error: "Failed to fetch factions" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}