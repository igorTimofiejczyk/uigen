import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// --- str_replace_editor ---

test("shows 'Creating <filename>' for str_replace_editor create command", () => {
  const tool: ToolInvocation = {
    state: "result",
    result: "Success",
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "src/components/Button.tsx" },
  };
  render(<ToolInvocationBadge toolInvocation={tool} />);
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("shows 'Editing <filename>' for str_replace_editor str_replace command", () => {
  const tool: ToolInvocation = {
    state: "result",
    result: "Success",
    toolCallId: "2",
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "src/components/Card.tsx" },
  };
  render(<ToolInvocationBadge toolInvocation={tool} />);
  expect(screen.getByText("Editing Card.tsx")).toBeDefined();
});

test("shows 'Editing <filename>' for str_replace_editor insert command", () => {
  const tool: ToolInvocation = {
    state: "result",
    result: "Success",
    toolCallId: "3",
    toolName: "str_replace_editor",
    args: { command: "insert", path: "src/components/Form.tsx" },
  };
  render(<ToolInvocationBadge toolInvocation={tool} />);
  expect(screen.getByText("Editing Form.tsx")).toBeDefined();
});

test("shows 'Reading <filename>' for str_replace_editor view command", () => {
  const tool: ToolInvocation = {
    state: "result",
    result: "Success",
    toolCallId: "4",
    toolName: "str_replace_editor",
    args: { command: "view", path: "src/components/Header.tsx" },
  };
  render(<ToolInvocationBadge toolInvocation={tool} />);
  expect(screen.getByText("Reading Header.tsx")).toBeDefined();
});

test("shows 'Undoing edit in <filename>' for str_replace_editor undo_edit command", () => {
  const tool: ToolInvocation = {
    state: "result",
    result: "Success",
    toolCallId: "5",
    toolName: "str_replace_editor",
    args: { command: "undo_edit", path: "src/components/Nav.tsx" },
  };
  render(<ToolInvocationBadge toolInvocation={tool} />);
  expect(screen.getByText("Undoing edit in Nav.tsx")).toBeDefined();
});

test("falls back to 'Editing file' when str_replace_editor has no path", () => {
  const tool: ToolInvocation = {
    state: "result",
    result: "Success",
    toolCallId: "6",
    toolName: "str_replace_editor",
    args: { command: "create" },
  };
  render(<ToolInvocationBadge toolInvocation={tool} />);
  expect(screen.getByText("Creating file")).toBeDefined();
});

// --- file_manager ---

test("shows 'Renaming <filename>' for file_manager rename command", () => {
  const tool: ToolInvocation = {
    state: "result",
    result: "Success",
    toolCallId: "7",
    toolName: "file_manager",
    args: { command: "rename", path: "src/components/Old.tsx" },
  };
  render(<ToolInvocationBadge toolInvocation={tool} />);
  expect(screen.getByText("Renaming Old.tsx")).toBeDefined();
});

test("shows 'Deleting <filename>' for file_manager delete command", () => {
  const tool: ToolInvocation = {
    state: "result",
    result: "Success",
    toolCallId: "8",
    toolName: "file_manager",
    args: { command: "delete", path: "src/components/Unused.tsx" },
  };
  render(<ToolInvocationBadge toolInvocation={tool} />);
  expect(screen.getByText("Deleting Unused.tsx")).toBeDefined();
});

// --- state indicators ---

test("shows green dot when tool call is complete", () => {
  const tool: ToolInvocation = {
    state: "result",
    result: "Success",
    toolCallId: "9",
    toolName: "str_replace_editor",
    args: { command: "create", path: "Component.tsx" },
  };
  const { container } = render(<ToolInvocationBadge toolInvocation={tool} />);
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
});

test("shows spinner when tool call is in progress", () => {
  const tool: ToolInvocation = {
    state: "call",
    toolCallId: "10",
    toolName: "str_replace_editor",
    args: { command: "create", path: "Component.tsx" },
  };
  const { container } = render(<ToolInvocationBadge toolInvocation={tool} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

// --- unknown tool ---

test("falls back to tool name for unknown tools", () => {
  const tool: ToolInvocation = {
    state: "result",
    result: "done",
    toolCallId: "11",
    toolName: "some_other_tool",
    args: {},
  };
  render(<ToolInvocationBadge toolInvocation={tool} />);
  expect(screen.getByText("some_other_tool")).toBeDefined();
});
