export class DayTwo {
  constructor({ bedTopZone, getPlayerPosition, onObjective, onDayLabel, onMessage }) {
    this.bedTopZone = bedTopZone;
    this.getPlayerPosition = getPlayerPosition;
    this.onObjective = onObjective;
    this.onDayLabel = onDayLabel;
    this.onMessage = onMessage;

    this.active = false;
    this.complete = false;
    this.startedAt = 0;
  }

  begin() {
    if (this.active || this.complete) return;
    this.active = true;
    this.startedAt = performance.now();
    this.onDayLabel?.('DAY 2');
    this.onMessage?.('Morning. The bed is your next way up.');
    this.onObjective?.('Day 2: reach the top of the bed using the hanging blanket.');
  }

  isOnBed() {
    const p = this.getPlayerPosition();
    const z = this.bedTopZone;
    return (
      p.x >= z.minX &&
      p.x <= z.maxX &&
      p.z >= z.minZ &&
      p.z <= z.maxZ &&
      p.y >= z.minY
    );
  }

  update() {
    if (!this.active || this.complete) return;
    if (!this.isOnBed()) return;

    this.complete = true;
    this.active = false;
    this.onMessage?.('You made it onto the bed. The desk route is now within reach.');
    this.onObjective?.('Day 2 complete: explore the bed and find a route toward the desk.');
  }
}
