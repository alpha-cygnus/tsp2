import { ItemSet, NamedMap } from "../common/types";

export class ParamProxy extends ItemSet<AudioParam> {
  // cancel(t: number): void {
  //   this.forEach((p) => {
  //     if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(t);
  //     else p.cancelScheduledValues(t);
  //   });
  // }
  // exponentialTo(value: number, endTime: number): void {
  //   this.forEach((p) => p.exponentialRampToValueAtTime(value, endTime));
  // }
  // linearTo(value: number, endTime: number): void {
  //   this.forEach((p) => p.linearRampToValueAtTime(value, endTime));
  // }
  // setTarget(target: number, startTime: number, timeConstant: number): void {
  //   this.forEach((p) => p.setTargetAtTime(target, startTime, timeConstant));
  // }
  // setValue(value: number, t: number): void {
  //   this.forEach((p) => p.setValueAtTime(value, t));
  // }
  // setValueCurve(values: number[] | Float32Array, startTime: number, duration: number): void {
  //   this.forEach((p) => p.setValueCurveAtTime(values, startTime, duration));
  // }
}

export class ParamContextData extends NamedMap<AudioParam, ParamProxy> {
  constructor() {
    super(() => new ParamProxy);
  }
}
