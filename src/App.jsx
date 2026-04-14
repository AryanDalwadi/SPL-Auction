import { useMemo, useState } from "react";
import AuctionPanel from "./components/AuctionPanel";
import AuctionRules from "./components/AuctionRules";
import Dashboard from "./components/Dashboard";
import PlayerManager from "./components/PlayerManager";
import TeamManager from "./components/TeamManager";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import {
  buildTeamShareLink,
  createId,
  downloadJson,
  getEligiblePlayers,
  PLAYER_SETS,
  readSharedTeamFromUrl,
  SET_LOGOS,
  SET_LIMITS,
  validateSale,
} from "./utils/auctionRules";

const AUCTION_STORAGE_KEY = "spl-auction-state-v1";

const INITIAL_STATE = {
  teams: [],
  players: [],
  auction: {
    currentSet: PLAYER_SETS[0],
    currentPlayerId: null,
    history: [],
    lastActionAt: null,
  },
};

function App() {
  const [auctionState, setAuctionState] = useLocalStorageState(
    AUCTION_STORAGE_KEY,
    INITIAL_STATE,
  );
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState("team-management");
  const sharedTeamData = useMemo(() => readSharedTeamFromUrl(), []);

  const teams = auctionState.teams;
  const players = auctionState.players;
  const currentSet = auctionState.auction.currentSet;

  const currentPlayer = useMemo(
    () =>
      players.find(
        (player) => player.id === auctionState.auction.currentPlayerId,
      ) ?? null,
    [players, auctionState.auction.currentPlayerId],
  );
  const eligiblePlayersForSet = useMemo(
    () => getEligiblePlayers(players, currentSet),
    [players, currentSet],
  );

  const updateAuctionState = (updater) => {
    setAuctionState((prev) => {
      const nextState = updater(prev);
      return {
        ...nextState,
        auction: {
          ...nextState.auction,
          lastActionAt: new Date().toISOString(),
        },
      };
    });
  };

  const addTeam = ({ teamName, captainName, totalPoints }) => {
    updateAuctionState((prev) => {
      const duplicateName = prev.teams.some(
        (team) => team.teamName.toLowerCase() === teamName.toLowerCase(),
      );
      if (duplicateName) {
        setMessage(`Team "${teamName}" already exists.`);
        return prev;
      }

      const team = {
        id: createId(),
        teamName,
        captainName,
        totalPoints,
        remainingPoints: totalPoints,
        spentBySet: {
          "Set A": 0,
          "Set B": 0,
          "Set C": 0,
        },
        players: [],
      };

      setMessage(`Team ${teamName} added.`);
      return {
        ...prev,
        teams: [...prev.teams, team],
      };
    });
  };

  const updateTeam = ({ teamId, teamName, captainName, totalPoints }) => {
    updateAuctionState((prev) => {
      const targetTeam = prev.teams.find((team) => team.id === teamId);
      if (!targetTeam) return prev;

      const duplicateName = prev.teams.some(
        (team) =>
          team.id !== teamId &&
          team.teamName.toLowerCase() === teamName.toLowerCase(),
      );
      if (duplicateName) {
        setMessage(`Team "${teamName}" already exists.`);
        return prev;
      }

      const spentPoints = targetTeam.totalPoints - targetTeam.remainingPoints;
      if (totalPoints < spentPoints) {
        setMessage(
          `Cannot set total below spent points (${spentPoints}) for ${targetTeam.teamName}.`,
        );
        return prev;
      }

      const updatedTeams = prev.teams.map((team) => {
        if (team.id !== teamId) return team;
        return {
          ...team,
          teamName,
          captainName,
          totalPoints,
          remainingPoints: totalPoints - spentPoints,
        };
      });

      setMessage(`Team ${teamName} updated.`);
      return {
        ...prev,
        teams: updatedTeams,
      };
    });
  };

  const addPlayer = ({ name, category, set }) => {
    updateAuctionState((prev) => {
      const duplicatePlayer = prev.players.some(
        (player) => player.name.toLowerCase() === name.toLowerCase(),
      );
      if (duplicatePlayer) {
        setMessage(`Player "${name}" already exists.`);
        return prev;
      }

      const player = {
        id: createId(),
        name,
        category,
        set,
        status: "available",
        soldToTeamId: null,
        finalBid: null,
      };

      setMessage(`Player ${name} added to ${set}.`);
      return {
        ...prev,
        players: [...prev.players, player],
      };
    });
  };

  const updatePlayer = ({ playerId, name, category, set }) => {
    updateAuctionState((prev) => {
      const targetPlayer = prev.players.find(
        (player) => player.id === playerId,
      );
      if (!targetPlayer) return prev;

      if (targetPlayer.status === "sold") {
        setMessage(
          "Sold players cannot be edited. Revert sale first if needed.",
        );
        return prev;
      }

      const duplicatePlayer = prev.players.some(
        (player) =>
          player.id !== playerId &&
          player.name.toLowerCase() === name.toLowerCase(),
      );
      if (duplicatePlayer) {
        setMessage(`Player "${name}" already exists.`);
        return prev;
      }

      const updatedPlayers = prev.players.map((player) => {
        if (player.id !== playerId) return player;
        return {
          ...player,
          name,
          category,
          set,
        };
      });

      setMessage(`Player ${name} updated.`);
      return {
        ...prev,
        players: updatedPlayers,
      };
    });
  };

  const setCurrentSet = (setName) => {
    updateAuctionState((prev) => ({
      ...prev,
      auction: {
        ...prev.auction,
        currentSet: setName,
        currentPlayerId: null,
      },
    }));
    setMessage(`Switched to ${setName}.`);
  };

  const beginWheelSpin = () => {
    setMessage("");
    updateAuctionState((prev) => ({
      ...prev,
      auction: {
        ...prev.auction,
        currentPlayerId: null,
      },
    }));
  };

  const selectPlayerFromWheel = (playerId) => {
    updateAuctionState((prev) => {
      const selectedPlayer = prev.players.find(
        (player) => player.id === playerId,
      );
      if (!selectedPlayer) {
        setMessage("Selected player is not available in current set.");
        return {
          ...prev,
          auction: {
            ...prev.auction,
            currentPlayerId: null,
          },
        };
      }

      const isEligible =
        selectedPlayer.set === prev.auction.currentSet &&
        (selectedPlayer.status === "available" ||
          selectedPlayer.status === "unsold");

      if (!isEligible) {
        setMessage("Player is not eligible for wheel selection.");
        return prev;
      }

      setMessage(`Wheel selected ${selectedPlayer.name}.`);
      return {
        ...prev,
        auction: {
          ...prev.auction,
          currentPlayerId: selectedPlayer.id,
        },
      };
    });
  };

  const markCurrentPlayerUnsold = () => {
    if (!currentPlayer) {
      setMessage("No current player to mark unsold.");
      return;
    }

    updateAuctionState((prev) => ({
      ...prev,
      players: prev.players.map((player) =>
        player.id === prev.auction.currentPlayerId
          ? { ...player, status: "unsold" }
          : player,
      ),
      auction: {
        ...prev.auction,
        currentPlayerId: null,
        history: [
          ...prev.auction.history,
          {
            type: "unsold",
            playerId: prev.auction.currentPlayerId,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    }));
    setMessage(`${currentPlayer.name} marked unsold.`);
  };

  const sellCurrentPlayer = ({ teamId, bidAmount }) => {
    if (!currentPlayer) {
      setMessage("No current player selected.");
      return;
    }

    updateAuctionState((prev) => {
      const team = prev.teams.find((item) => item.id === teamId);
      const player = prev.players.find(
        (item) => item.id === prev.auction.currentPlayerId,
      );
      if (!player) {
        setMessage("Current player not found.");
        return prev;
      }

      if (player.status === "sold") {
        setMessage("This player is already sold.");
        return prev;
      }

      const validation = validateSale({
        team,
        playerSet: player.set,
        bidAmount,
      });
      if (!validation.valid) {
        setMessage(validation.message);
        return prev;
      }

      const updatedTeams = prev.teams.map((item) => {
        if (item.id !== teamId) return item;
        return {
          ...item,
          remainingPoints: item.remainingPoints - bidAmount,
          spentBySet: {
            ...item.spentBySet,
            [player.set]: (item.spentBySet[player.set] ?? 0) + bidAmount,
          },
          players: [...item.players, player.id],
        };
      });

      const updatedPlayers = prev.players.map((item) => {
        if (item.id !== player.id) return item;
        return {
          ...item,
          status: "sold",
          soldToTeamId: teamId,
          finalBid: bidAmount,
        };
      });

      setMessage(`${player.name} sold to ${team.teamName} for ${bidAmount}.`);
      return {
        ...prev,
        teams: updatedTeams,
        players: updatedPlayers,
        auction: {
          ...prev.auction,
          currentPlayerId: null,
          history: [
            ...prev.auction.history,
            {
              type: "sale",
              playerId: player.id,
              teamId,
              bidAmount,
              timestamp: new Date().toISOString(),
            },
          ],
        },
      };
    });
  };

  const revertPlayerSale = (playerId) => {
    updateAuctionState((prev) => {
      const player = prev.players.find((item) => item.id === playerId);
      if (
        !player ||
        player.status !== "sold" ||
        !player.soldToTeamId ||
        !player.finalBid
      ) {
        setMessage("Selected player does not have a completed sale to revert.");
        return prev;
      }

      const team = prev.teams.find((item) => item.id === player.soldToTeamId);
      if (!team) {
        setMessage("Team not found for selected sale.");
        return prev;
      }

      const updatedTeams = prev.teams.map((item) => {
        if (item.id !== team.id) return item;
        const nextSetSpent = Math.max(
          0,
          (item.spentBySet[player.set] ?? 0) - Number(player.finalBid),
        );
        return {
          ...item,
          remainingPoints: item.remainingPoints + Number(player.finalBid),
          spentBySet: {
            ...item.spentBySet,
            [player.set]: nextSetSpent,
          },
          players: item.players.filter((id) => id !== player.id),
        };
      });

      const updatedPlayers = prev.players.map((item) => {
        if (item.id !== player.id) return item;
        return {
          ...item,
          status: "available",
          soldToTeamId: null,
          finalBid: null,
        };
      });

      setMessage(`Sale reverted for ${player.name}.`);
      return {
        ...prev,
        teams: updatedTeams,
        players: updatedPlayers,
        auction: {
          ...prev.auction,
          history: [
            ...prev.auction.history,
            {
              type: "revert-sale",
              playerId: player.id,
              teamId: team.id,
              bidAmount: player.finalBid,
              timestamp: new Date().toISOString(),
            },
          ],
        },
      };
    });
  };

  const exportAuctionData = () => {
    downloadJson("auction-data.json", {
      teams,
      players,
      currentSet,
      currentPlayer,
      generatedAt: new Date().toISOString(),
    });
  };

  const resetAuction = () => {
    const confirmed = window.confirm(
      "Reset auction data? This cannot be undone.",
    );
    if (!confirmed) return;
    setAuctionState(INITIAL_STATE);
    setMessage("Auction reset complete.");
  };

  const shareTeamLink = (teamId) => {
    const team = teams.find((item) => item.id === teamId);
    if (!team) {
      setMessage("Team not found for sharing.");
      return "";
    }

    const teamPlayers = players
      .filter((player) => player.soldToTeamId === teamId)
      .map((player) => ({
        name: player.name,
        category: player.category,
        set: player.set,
        bid: player.finalBid,
      }));

    const shareLink = buildTeamShareLink({
      teamName: team.teamName,
      captainName: team.captainName,
      players: teamPlayers,
      generatedAt: new Date().toISOString(),
    });
    setMessage(`Share link generated for ${team.teamName}.`);
    return shareLink;
  };

  const menuItems = [
    { id: "auction-rules", label: "Auction Rules" },
    { id: "team-management", label: "Team Management" },
    { id: "player-management", label: "Player Management" },
    { id: "auction-panel", label: "Auction + Dashboard" },
  ];

  const showSection = (sectionId) => {
    setActiveSection(sectionId);
  };

  if (sharedTeamData) {
    return (
      <main className="app-layout">
        <section className="card">
          <div className="season-tag">
            {SET_LOGOS[currentSet] ?? "SPL Season 4"}
          </div>
          <h1>Team Share View</h1>
          <p>
            Team Name: <strong>{sharedTeamData.teamName}</strong>
          </p>
          <p>
            Captain Name: <strong>{sharedTeamData.captainName}</strong>
          </p>

          <h3>Players</h3>
          {sharedTeamData.players.length === 0 ? (
            <p>No players assigned yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Set</th>
                  <th>Bid</th>
                </tr>
              </thead>
              <tbody>
                {sharedTeamData.players.map((player, index) => (
                  <tr key={`${player.name}-${index}`}>
                    <td>{player.name}</td>
                    <td>{player.category}</td>
                    <td>{player.set}</td>
                    <td>{player.bid ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="app-layout">
      <header className="app-header">
        <h1>SPL Season 4 - Gully Cricket Auction</h1>
        <p>
          Manage teams, players, and live auction flow with local storage
          persistence.
        </p>
      </header>

      <nav className="menu-bar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`menu-item ${activeSection === item.id ? "active" : ""}`}
            onClick={() => showSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {activeSection === "auction-rules" ? (
        <section id="auction-rules" className="app-section">
          <AuctionRules />
        </section>
      ) : null}

      {activeSection === "team-management" ? (
        <section id="team-management" className="app-section">
          <TeamManager
            teams={teams}
            onAddTeam={addTeam}
            onUpdateTeam={updateTeam}
            onShareTeamLink={shareTeamLink}
          />
        </section>
      ) : null}

      {activeSection === "player-management" ? (
        <section id="player-management" className="app-section">
          <PlayerManager
            players={players}
            onAddPlayer={addPlayer}
            onUpdatePlayer={updatePlayer}
          />
        </section>
      ) : null}

      {activeSection === "auction-panel" ? (
        <section id="auction-panel" className="app-section">
          <AuctionPanel
            teams={teams}
            currentSet={currentSet}
            currentPlayer={currentPlayer}
            eligiblePlayers={eligiblePlayersForSet}
            message={message}
            onSetChange={setCurrentSet}
            onWheelSpinStart={beginWheelSpin}
            onSelectPlayerFromWheel={selectPlayerFromWheel}
            onMarkUnsold={markCurrentPlayerUnsold}
            onSellPlayer={sellCurrentPlayer}
          />
          <Dashboard
            teams={teams}
            players={players}
            currentPlayer={currentPlayer}
            currentSet={currentSet}
            setLimits={SET_LIMITS}
            onResetAuction={resetAuction}
            onExportData={exportAuctionData}
            onRevertSale={revertPlayerSale}
          />
        </section>
      ) : null}
    </main>
  );
}

export default App;
