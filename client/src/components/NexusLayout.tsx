import { useState } from "react";
import { StatusBar } from "./StatusBar";
import { CommandBar } from "./CommandBar";
import { NarrativePane, type NarrativeChunk } from "./NarrativePane";
import { NavigationPane } from "./NavigationPane";

export function NexusLayout() {
  const [currentChunk, setCurrentChunk] = useState(1);
  const [showNavigation, setShowNavigation] = useState(true);
  const [currentModel, setCurrentModel] = useState("Llama 3.3");
  const [isStoryMode, setIsStoryMode] = useState(true);
  const [apexStatus, setApexStatus] = useState<
    "OFFLINE" | "READY" | "TRANSMITTING" | "GENERATING" | "RECEIVING"
  >("READY");
  const [provisionalSection, setProvisionalSection] = useState<string | null>(null);
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false);

  const mockChunks: NarrativeChunk[] = [
    {
      id: 1,
      season: 1,
      episode: 1,
      scene: 1,
      sections: [
        {
          type: "storyteller",
          content:
            "The neon-lit streets of Neo-Tokyo stretched before you, rain-slicked and gleaming with a thousand reflections. Your cybernetic hand flickered with a diagnostic warning—something was wrong with the neural interface.",
        },
        {
          type: "you",
          content: "I check the diagnostic readout on my arm panel.",
        },
        {
          type: "storyteller",
          content:
            "The holographic display materializes above your wrist, cascading lines of code revealing the source: an unauthorized access attempt from an unknown netrunner. Your handler's voice crackles through your cochlear implant: 'Alex, you've got a tail. Corporate netrunner, high-grade ICE. Get to the safe house, now.'",
        },
      ],
      metadata: {
        location: "Downtown Neo-Tokyo",
        timestamp: "2087-03-15 23:47",
        characters: ["Alex", "Handler"],
      },
    },
  ];

  const handleCommand = (command: string) => {
    console.log("Command:", command);

    if (command.startsWith("/")) {
      const [cmd, ...args] = command.slice(1).split(" ");

      switch (cmd.toLowerCase()) {
        case "nav":
          setShowNavigation(!showNavigation);
          break;
        case "story":
          setIsStoryMode(true);
          setApexStatus("READY");
          break;
        case "model":
          const modelArg = args.join(" ").trim();
          if (modelArg) {
            setCurrentModel(modelArg);
          }
          break;
        case "help":
          console.log(
            "Available commands: /nav, /story, /model <name>, /help"
          );
          break;
        default:
          console.log("Unknown command:", cmd);
      }
    } else if (isStoryMode) {
      if (isAwaitingConfirmation) {
        if (command === "CANCEL") {
          setProvisionalSection(null);
          setIsAwaitingConfirmation(false);
        } else {
          setProvisionalSection(null);
          setIsAwaitingConfirmation(false);
          setApexStatus("TRANSMITTING");
          setTimeout(() => setApexStatus("GENERATING"), 1000);
          setTimeout(() => setApexStatus("RECEIVING"), 3000);
          setTimeout(() => setApexStatus("READY"), 5000);
        }
      } else {
        setProvisionalSection(command);
        setIsAwaitingConfirmation(true);
      }
    }
  };

  const handleChunkSelect = (chunkId: number) => {
    setCurrentChunk(chunkId);
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col font-mono overflow-hidden dark">
      <StatusBar
        model={currentModel}
        season={1}
        episode={1}
        scene={1}
        apexStatus={apexStatus}
        isStoryMode={isStoryMode}
        onHamburgerClick={() => setShowNavigation(!showNavigation)}
      />

      <div className="flex-1 flex overflow-hidden">
        <NarrativePane
          chunks={mockChunks}
          currentChunk={currentChunk}
          mode="read"
          provisionalSection={provisionalSection}
        />

        <NavigationPane
          currentChunk={currentChunk}
          onChunkSelect={handleChunkSelect}
          isCollapsed={!showNavigation}
        />
      </div>

      <CommandBar
        onCommand={handleCommand}
        placeholder={
          isAwaitingConfirmation
            ? "ENTER to confirm"
            : isStoryMode
              ? "continue the story"
              : "Enter directive or /command..."
        }
        userPrefix={isStoryMode ? "ALEX" : "NEXUS:USER"}
        isAwaitingConfirmation={isAwaitingConfirmation}
      />
    </div>
  );
}
