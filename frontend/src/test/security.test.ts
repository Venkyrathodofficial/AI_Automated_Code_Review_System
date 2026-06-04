import { describe, expect, it } from "vitest";
import {
  calculateSecurityScore,
  getSecurityGrade,
  getSecurityRiskLevel,
  validateGeminiSecurityFix,
} from "@/lib/security";

describe("security score engine", () => {
  it("applies the requested weighted deductions", () => {
    const profile = calculateSecurityScore({ critical: 2, high: 1, medium: 3, low: 4 });

    expect(profile.score).toBe(46);
    expect(profile.grade).toBe("F");
    expect(profile.riskLevel).toBe("Critical Risk");
    expect(profile.deductions).toBe(54);
  });

  it("maps grades and risk levels correctly", () => {
    expect(getSecurityGrade(96)).toBe("A+");
    expect(getSecurityGrade(91)).toBe("A");
    expect(getSecurityGrade(84)).toBe("B");
    expect(getSecurityGrade(73)).toBe("C");
    expect(getSecurityGrade(61)).toBe("D");
    expect(getSecurityGrade(59)).toBe("F");

    expect(getSecurityRiskLevel(95)).toBe("Low Risk");
    expect(getSecurityRiskLevel(80)).toBe("Medium Risk");
    expect(getSecurityRiskLevel(60)).toBe("High Risk");
    expect(getSecurityRiskLevel(49)).toBe("Critical Risk");
  });
});

describe("Gemini security fix validation", () => {
  it.each([
    [
      'const apiKey = "secret";',
      "API Key Exposure",
      "Move secret into environment variables.",
    ],
    [
      'query = "SELECT * FROM users WHERE id=" + id;',
      "SQL Injection Risk",
      "Parameterized query.",
    ],
    [
      "element.innerHTML = userInput;",
      "Cross Site Scripting (XSS)",
      "Input sanitization or safe rendering.",
    ],
    [
      'password === "admin123"',
      "Hardcoded Credential",
      "Use secure authentication flow.",
    ],
    [
      "Known vulnerable dependency version.",
      "Insecure Dependency",
      "Recommended secure dependency upgrade.",
    ],
  ])("detects %s", (code, detection, expectedFix) => {
    expect(validateGeminiSecurityFix(code)).toEqual({ detection, expectedFix });
  });
});