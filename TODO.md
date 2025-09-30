## NEXUS Interface Handoff Summary

### Current State
The project has a basic React/TypeScript cyberpunk terminal interface with mobile responsiveness, but it's currently displaying hardcoded mock data about "Neo-Tokyo" instead of the real NEXUS narrative data. No database connection has been established yet.

### What Exists
- Basic cyberpunk terminal UI with green phosphor aesthetic
- Mobile-responsive layout with hamburger menu
- Components: `NexusLayout`, `StatusBar`, `CommandBar`, `NarrativePane`, `NavigationPane`
- PostgreSQL database available but not connected
- Drizzle ORM already installed

### What Needs to Be Built

1. **Import SQL Dump** (`attached_assets/massiveDUMP_1759202904039.sql`)
   - 112,411 lines containing the complete NEXUS database
   - Key data: 1,425 narrative chunks, 5 seasons, Alex Ward (character ID 1)
   - Complex schema with narrative_chunks, chunk_metadata, characters, character_psychology, character_relationships, places, zones, episodes, factions
   - Uses PostgreSQL-specific features: PostGIS geometry, pgvector, custom ENUMs, int8range types

2. **Create Three Tabs** (currently only has single view):
   - **NARRATIVE**: Expandable hierarchy Season → Episode → Chunk
   - **MAP**: Interactive map with place pins and zone shading  
   - **CHARACTERS**: Profiles grouped by ID ranges (1-10 main, 11-20 supporting, etc.)

3. **Connect to Real Data**:
   - Create Drizzle schema matching the PostgreSQL structure
   - Build API routes for data access
   - Update frontend components to fetch from real endpoints
   - Remove all mock data

### Important Schema Notes
- Characters table has ID, name, summary, appearance, background, personality, etc.
- Places have coordinates (PostGIS point type) and belong to zones
- Chunks have metadata including slug (e.g., "S01E01_001") 
- Character relationships are bidirectional with emotional_valence
- Some characters have detailed psychology profiles

### User Requirements
- Alex Ward (ID 1) should display the provided portrait image
- Other characters show dark silhouettes
- Map should show all places as pins with zone shading
- Narrative browser should use chunk slugs or scene numbers as labels
- Maintain strict cyberpunk terminal aesthetic throughout

### Technical Approach
1. Import SQL dump using `psql $DATABASE_URL < attached_assets/massiveDUMP_1759202904039.sql`
2. Create minimal Drizzle schema focusing on structure, not data
3. Build storage interface and API routes
4. Update frontend components to fetch and display real data
5. Test with actual database content

**Key Warning**: Don't try to read all the data - just understand the schema structure. The dataset is too large to process in detail.