/* shared/constants.js — single source of truth for message types, tool names, storage keys. */
(function (root) {
  "use strict";
  const MSG = {
    // UI -> BG
    USER_PROMPT: "user_prompt",
    CANCEL_RUN: "cancel_run",
    APPROVE_PERMISSION: "approve_permission",
    DENY_PERMISSION: "deny_permission",
    GET_SETTINGS: "get_settings",
    SET_SETTINGS: "set_settings",
    GET_GRANTS: "get_grants",
    REVOKE_GRANT: "revoke_grant",
    REVOKE_ALL_GRANTS: "revoke_all_grants",
    GET_AUDIT: "get_audit",
    CLEAR_CONVERSATION: "clear_conversation",
    OPEN_SETTINGS: "open_settings",
    FOCUS_COMPOSER: "focus_composer",
    // BG -> UI
    RUN_STARTED: "run_started",
    ASSISTANT_DELTA: "assistant_delta",
    ASSISTANT_MESSAGE: "assistant_message",
    PLAN_UPDATED: "plan_updated",
    TOOL_CALL: "tool_call",
    PERMISSION_REQUEST: "permission_request",
    RUN_FINISHED: "run_finished",
    RUN_ERROR: "run_error",
    CONTEXT_UPDATED: "context_updated",
    USAGE_UPDATED: "usage_updated",
    SETTINGS_RESULT: "settings_result",
    GRANTS_RESULT: "grants_result",
    AUDIT_RESULT: "audit_result",
    CONVERSATION_CLEARED: "conversation_cleared",
    // Content <-> BG
    CONTENT_READY: "content_ready",
    SNAPSHOT_REQUEST: "snapshot_request",
    SNAPSHOT_RESULT: "snapshot_result",
    EXECUTE_ACTION: "execute_action",
    ACTION_RESULT: "action_result",
    // BG -> content
    PING: "ping"
  };

  const TOOL = {
    READ_PAGE: "read_page",
    GET_READABLE_TEXT: "get_readable_text",
    SNAPSHOT_FORM: "snapshot_form",
    FIND_ELEMENTS: "find_elements",
    GET_ELEMENT_DETAILS: "get_element_details",
    EXTRACT_TABLE: "extract_table",
    GET_LINKS: "get_links",
    GET_PAGE_METADATA: "get_page_metadata",
    GET_SELECTION: "get_selection",
    SCROLL_TO: "scroll_to",
    CLICK: "click",
    TYPE_TEXT: "type_text",
    SELECT_OPTION: "select_option",
    SET_CHECKBOX: "set_checkbox",
    PRESS_KEY: "press_key",
    HOVER: "hover",
    NAVIGATE: "navigate",
    SUBMIT_FORM: "submit_form",
    OPEN_LINK_IN_NEW_TAB: "open_link_in_new_tab",
    UPLOAD_FILE: "upload_file",
    DOWNLOAD_FILE: "download_file"
  };

  const TIER = { READ: "read", INTERACT: "interact", SENSITIVE: "sensitive" };

  const SCOPE = { ONCE: "once", SESSION: "session", FOREVER: "forever" };

  const STORAGE = {
    SETTINGS: "dgai_settings",
    GRANTS: "dgai_grants",
    TRUSTED: "dgai_trusted",
    AUDIT: "dgai_audit",
    CONVERSATION: "dgai_conversation",
    PROFILE: "dgai_profile"
  };

  const MAX_TURNS = 6;
  const SNAPSHOT_TEXT_CAP = 8000;
  const MAX_ELEMENTS = 300;
  const AUDIT_CAP = 200;

  root.DGAI_CONSTANTS = { MSG, TOOL, TIER, SCOPE, STORAGE, MAX_TURNS, SNAPSHOT_TEXT_CAP, MAX_ELEMENTS, AUDIT_CAP };
  if (typeof module !== "undefined") module.exports = root.DGAI_CONSTANTS;
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));