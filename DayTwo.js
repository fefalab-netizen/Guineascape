export class DayTwo {
  constructor({
    bedTopZone,
    nightstandZone,
    deskTopZone,
    windowSillZone,
    routeState,
    getPlayerPosition,
    onObjective,
    onDayLabel,
    onMessage,
  }) {
    this.bedTopZone = bedTopZone;
    this.nightstandZone = nightstandZone;
    this.deskTopZone = deskTopZone;
    this.windowSillZone = windowSillZone;
    this.routeState = routeState;
    this.getPlayerPosition = getPlayerPosition;
    this.onObjective = onObjective;
    this.onDayLabel = onDayLabel;
    this.onMessage = onMessage;

    this.active = false;
    this.complete = false;
    this.stage = 0;
    this.lastAnnouncedStage = -1;
  }

  begin() {
    if (this.active || this.complete) return;
    this.active = true;
    this.stage = 0;
    this.announceStage();
  }

  inZone(zone) {
    const p = this.getPlayerPosition();
    return (
      p.x >= zone.minX &&
      p.x <= zone.maxX &&
      p.z >= zone.minZ &&
      p.z <= zone.maxZ &&
      p.y >= zone.minY
    );
  }

  announceStage() {
    if (this.stage === this.lastAnnouncedStage) return;
    this.lastAnnouncedStage = this.stage;

    const stages = [
      {
        day: 'DAY 2',
        message: 'Morning. The hanging blanket is your first route upward.',
        objective: 'Day 2: climb the blanket and reach the top of the bed.',
      },
      {
        day: 'DAY 3',
        message: 'From up here, the nightstand is close enough to reach.',
        objective: 'Day 3: cross from the bed to the nightstand using the book bridge.',
      },
      {
        day: 'DAY 4',
        message: 'A charger cable hangs from the desk above.',
        objective: 'Day 4: climb the charger cable and reach the desk.',
      },
      {
        day: 'DAY 5',
        message: 'The window is close, but its latch is made for human fingers.',
        objective: 'Day 5: find something on the desk that can work the window latch.',
      },
      {
        day: 'DAY 6',
        message: 'You have the tool. The windowsill is the next climb.',
        objective: 'Day 6: climb the curtain cord, reach the sill, and release the window latch.',
      },
      {
        day: 'DAY 7',
        message: 'The window is unlocked. One last push.',
        objective: 'Day 7: open the window and get outside.',
      },
    ];

    const current = stages[this.stage];
    if (!current) return;
    this.onDayLabel?.(current.day);
    this.onMessage?.(current.message);
    this.onObjective?.(current.objective);
  }

  update() {
    if (!this.active || this.complete) return;

    if (this.stage === 0 && this.inZone(this.bedTopZone)) {
      this.stage = 1;
      this.announceStage();
      return;
    }

    if (this.stage === 1 && this.inZone(this.nightstandZone)) {
      this.stage = 2;
      this.announceStage();
      return;
    }

    if (this.stage === 2 && this.inZone(this.deskTopZone)) {
      this.stage = 3;
      this.announceStage();
      return;
    }

    if (this.stage === 3 && this.routeState.paperclipTaken) {
      this.stage = 4;
      this.announceStage();
      return;
    }

    if (this.stage === 4 && this.routeState.windowUnlatched) {
      this.stage = 5;
      this.announceStage();
      return;
    }

    if (this.stage === 5 && this.routeState.escaped) {
      this.complete = true;
      this.active = false;
      this.onDayLabel?.('FREE');
      this.onMessage?.('Cold air. Open sky. You made it outside.');
      this.onObjective?.('Escape complete — the bedroom is behind you.');
    }
  }
}
