import { expect } from "@playwright/test";
import { exec } from "child_process";
import { Log } from "./logs";

export class LogUtils {
  /**
   * Validates if the actual log matches the expected log values.
   * It compares both primitive and nested object properties.
   *
   * @param actual The actual log returned by the system
   * @param expected The expected log values to validate against
   */
  public static validateLog(actual: Log, expected: Partial<Log>) {
    // Loop through each key in the expected log object
    Object.keys(expected).forEach((key) => {
      const expectedValue = expected[key as keyof Log];
      const actualValue = actual[key as keyof Log];

      LogUtils.compareValues(actualValue, expectedValue);
    });
  }

  /**
   * Compare the actual and expected values. Uses 'toBe' for numbers and 'toContain' for strings/arrays.
   * Handles nested object comparison.
   *
   * @param actual The actual value to compare
   * @param expected The expected value
   */
  private static compareValues(actual: unknown, expected: unknown) {
    if (typeof expected === "object" && expected !== null) {
      Object.keys(expected).forEach((subKey) => {
        const expectedSubValue = expected[subKey];
        const actualSubValue = actual?.[subKey];
        LogUtils.compareValues(actualSubValue, expectedSubValue);
      });
    } else if (typeof expected === "number") {
      expect(actual).toBe(expected);
    } else {
      expect(actual).toContain(expected);
    }
  }

  /**
   * Executes a shell command and returns the output as a promise.
   *
   * @param command The shell command to execute
   * @returns A promise that resolves with the command output
   */
  static executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(
        command,
        { encoding: "utf8", shell: "/bin/bash" },
        (error, stdout, stderr) => {
          if (error) {
            console.error("Error executing command:", error);
            reject(`Error: ${error.message}`);
            return;
          }
          if (stderr) {
            console.warn("stderr warning:", stderr);
          }
          resolve(stdout);
        },
      );
    });
  }

  /**
   * Fetches the logs from pods that match the fixed pod selector and applies a grep filter.
   * The pod selector is:
   * - app.kubernetes.io/component=backstage
   * - app.kubernetes.io/instance=redhat-developer-hub
   * - app.kubernetes.io/name=developer-hub
   *
   * @param grepFilter The string to filter the logs using grep
   * @returns A promise that resolves with the filtered logs
   */
  static async getPodLogsWithGrep(grepFilter: string): Promise<string> {
    const podSelector =
      "app.kubernetes.io/component=backstage,app.kubernetes.io/instance=rhdh,app.kubernetes.io/name=backstage";
    const tailNumber = 30;
    const command = `oc logs -l ${podSelector} --tail=${tailNumber} -c backstage-backend -n ${process.env.NAME_SPACE} | grep "${grepFilter}" | head -n 1`;
    console.log(command);
    try {
      return await LogUtils.executeCommand(command);
    } catch (error) {
      console.error("Error fetching logs:", error);
      throw new Error(`Failed to fetch logs: ${error}`);
    }
  }

  /**
   * Logs in to OpenShift using a token and server URL.
   *
   * @returns A promise that resolves when the login is successful
   */
  static async loginToOpenShift(): Promise<void> {
    const command = `oc login --token="${process.env.K8S_CLUSTER_TOKEN}" --server="${process.env.K8S_CLUSTER_URL}"`;
    try {
      const result = await LogUtils.executeCommand(command);
      console.log("Login successful:", result);
    } catch (error) {
      console.error("Error during login:", error);
      throw new Error(`Failed to login to OpenShift: ${error}`);
    }
  }

  /**
   * Validates if the actual log matches the expected log values for a specific event.
   * This is a reusable method for different log validations across various tests.
   *
   * @param eventName The name of the event to filter in the logs
   * @param message The expected log message
   * @param method The HTTP method used in the log (GET, POST, etc.)
   * @param url The URL endpoint that was hit in the log
   * @param baseURL The base URL of the application, used to get the hostname
   * @param plugin The plugin name that triggered the log event
   */
  public static async validateLogEvent(
    eventName: string,
    message: string,
    method: string,
    url: string,
    baseURL: string,
    plugin: string,
  ) {
    const actualLog = await LogUtils.getPodLogsWithGrep(eventName);
    const expectedLog: Partial<Log> = {
      actor: {
        hostname: new URL(baseURL).hostname,
      },
      message,
      plugin,
      request: {
        method,
        url,
      },
    };
    console.log(actualLog);
    LogUtils.validateLog(JSON.parse(actualLog), expectedLog);
  }
}
