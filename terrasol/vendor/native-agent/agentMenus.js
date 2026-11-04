// @ts-check
// AGENT6: the Controls pane's grouped rows, in its order, with LIVE primary then secondary bindings.
import { actionLabel, getBinding, HIDDEN_ACTIONS } from '../systems/inputActions.js';
import { shownGroups } from '../ui/enhanced/enhancedControls.js';

/** ui/enhancedControls.js shownGroups owns the mod-on gate. No staged/unsaved edits are exposed. */
export function readControlsMenu(store, groups = shownGroups()) {
  return groups.flatMap((group) => group.rows.filter((r) => !HIDDEN_ACTIONS.includes(r.action)).map(({ action }) => ({
    action, label: actionLabel(action), group: group.title,
    primary: getBinding(store, action, true), secondary: getBinding(store, action, false),
  })));
}
