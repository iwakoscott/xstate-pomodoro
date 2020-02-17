import React from "react";
import { Machine, assign } from "xstate";
import { useMachine } from "@xstate/react";
import moment from "moment";

const POMODORO_CONFIG = {
  BREAK_TIME: 0.2,
  WORK_TIME: 0.1
};

const PomodoroClock = Machine({
  id: "pomodoro",
  initial: "inactive",
  context: {
    breakTime: POMODORO_CONFIG.BREAK_TIME, // 5 minutes
    workTime: POMODORO_CONFIG.WORK_TIME, // 15 minutes
    timer: POMODORO_CONFIG.WORK_TIME * 60 * 1000,
    onBreak: false
  },
  states: {
    inactive: {
      on: {
        TOGGLE: "active"
      }
    },
    active: {
      on: {
        TOGGLE: "inactive",
        TIMER_COMPLETE: {
          target: "inactive",
          actions: assign({
            onBreak: context => !context.onBreak,
            timer: context =>
              (context.onBreak ? context.workTime : context.breakTime) *
              60 *
              1000
          })
        },
        TICK: {
          cond: context => context.timer > 0,
          actions: assign({
            timer: context => context.timer - 1000
          })
        },
        INCREMENT: {
          target: "inactive"
        }
      }
    }
  }
});

export default function App() {
  const [current, send] = useMachine(PomodoroClock);

  React.useEffect(() => {
    if (current.context.timer === 0) {
      send("TIMER_COMPLETE");
    }
  }, [current, send]);

  React.useEffect(() => {
    if (current.matches("active")) {
      const timeout = setInterval(() => {
        send("TICK");
      }, 1000);
      return () => clearInterval(timeout);
    }
  }, [current, send]);

  const minutes = moment
    .duration(current.context.timer, "milliseconds")
    .minutes();
  const seconds = moment
    .duration(current.context.timer, "milliseconds")
    .seconds();

  return (
    <div className="App">
      <h1>
        {minutes < 10 ? `0${minutes}` : minutes}:
        {seconds < 10 ? `0${seconds}` : seconds}
      </h1>
      <button onClick={() => send("TOGGLE")}>
        {current.matches("inactive") ? "ON" : "OFF"}
      </button>
      <button onClick={() => send("INCREMENT")}>+</button>
    </div>
  );
}
