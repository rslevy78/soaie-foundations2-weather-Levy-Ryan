# WeatherWise: Fahrenheit/Celsius Toggle — Design

**Date:** 2026-09-22  
**Status:** Approved  
**Scope:** Bounded — small enhancement to the existing WeatherWise 7-day forecast app

## Problem

The app currently renders temperatures in Fahrenheit only. Users with a preference for metric units cannot switch to Celsius without manually converting values in their head. This is a small but meaningful usability issue for a public-facing weather app and a clear candidate for a low-risk UI enhancement.

## Goals

- Add a simple unit toggle so users can switch between Fahrenheit and Celsius.
- Keep the default experience aligned with the current app: Fahrenheit remains the default state.
- Update all displayed daily high/low temperatures immediately when the user toggles.
- Preserve the existing live-data and sample-data fallback behavior.
- Keep the change visually lightweight and consistent with the app's current design language.

## Non-Goals

- No city switching, geolocation, or multi-location support.
- No persistence of user preference across sessions.
- No backend changes or API redesign beyond a UI-level setting.
- No new weather data fetches just to swap units; the toggle should work without reloading the app.

## Out of Scope

The following items are explicitly outside this feature and should not be included unless a new requirement is approved separately:

- Converting the Open-Meteo API request itself to Celsius for the live data source.
- Saving the chosen unit in `localStorage`, cookies, or any backend persistence layer.
- Auto-detecting the user's locale and overriding the explicit toggle.
- Adding a settings page, modal, or any larger configuration system.
- Updating the sunset-photo recommendations or other non-temperature UI to use the selected unit.
- Supporting multiple cities or a location selector.
- Reworking the app into a framework, adding tests, or introducing other tooling beyond the existing static front-end setup.

## Existing Behavior

The page already renders a Seattle 7-day forecast using values from the Open-Meteo API. The app requests data in Fahrenheit, and the `renderForecast()` function prints high and low temperatures as `day.high` and `day.low` with a `°` suffix.

Sample-data fallback also uses Fahrenheit values, so the page remains consistent during network failures.

## Approved UX

The selected approach is a compact segmented control placed beside the location block in the header. This is the recommended balance of clarity, minimal surface area, and matching the app's current visual language.

- `°F` button (selected by default)
- `°C` button

This behaves as a clear, explicit toggle with a visible active state rather than a hidden dropdown or locale-based auto-detection. The control should remain keyboard accessible and visually consistent with the app's soft-card aesthetic.

Behavior:

- On first load, the app defaults to Fahrenheit.
- Clicking `°C` converts all displayed day highs and lows from Fahrenheit to Celsius.
- Clicking `°F` converts all displayed values back to Fahrenheit.
- The toggle affects the forecast cards and any other temperature labels rendered from the same data.
- The toggle does not affect the sunset-quality cards, since those are not temperature-based.
- The app does not persist the choice across sessions unless it is explicitly added later; the current scope is a session-local UI toggle.

## Data Model

The app should keep the raw weather values in a single canonical format and convert only for display.

Approved approach:

- Store `day.high` and `day.low` in Fahrenheit because the API and existing sample data already use that scale.
- Add a state object that tracks the active UI unit without refetching the underlying data.
- Add a small pure conversion helper:

```js
const state = {
  unit: "fahrenheit",
  days: [],
};

function convertTemperature(value, unit) {
  if (unit === "celsius") {
    return ((value - 32) * 5) / 9;
  }
  return value;
}
```

- Add `formatTemperature(value, unit)` to round and format values for the DOM:

```js
function formatTemperature(value, unit) {
  const converted = convertTemperature(value, unit);
  const rounded = Math.round(converted);
  return `${rounded}°${unit === "celsius" ? "C" : "F"}`;
}
```

This keeps the app simple, avoids re-fetching data, and matches the feature's bounded scope.

## Rendering and State

The state object should include the dataset in its original Fahrenheit values plus the currently selected display unit.

```js
const state = {
  unit: "fahrenheit",
  days: [],
};
```

Add `updateUnitButtons()` and `handleUnitToggle()` so the UI updates the selected button state and re-renders the forecast cards without refetching the data.

Pseudo-flow:

1. Fetch or generate the 7-day dataset.
2. Store days as Fahrenheit values in `state.days`.
3. Render cards using the currently selected unit.
4. User clicks the toggle.
5. Update `state.unit` and active button styling.
6. Re-render the forecast cards with converted values.

This keeps the feature tightly scoped and easy to reason about.

## UI Details

The toggle belongs in the top-level app layout near the header or status area. A good layout is a row with the location block on the left and a compact toggle group on the right.

Approved markup:

```html
<div class="header-actions">
  <div class="location"> ... </div>
  <div class="unit-toggle" role="tablist" aria-label="Temperature unit">
    <button type="button" class="unit-btn is-active" data-unit="fahrenheit" aria-pressed="true">°F</button>
    <button type="button" class="unit-btn" data-unit="celsius" aria-pressed="false">°C</button>
  </div>
</div>
```

Styling should align with the existing soft-card look:

- pill-shaped container or segmented buttons
- active state with stronger contrast
- keyboard focus ring visible
- no new heavy animation necessary
- a compact layout that sits correctly beside the location block on desktop and stacks cleanly on narrow screens

## Error Handling

- If the app is using sample data, the toggle still works and converts those Fahrenheit values to Celsius.
- If a temperature field is missing or invalid, the UI should render `—` instead of throwing.
- The toggle should be resilient to changes in data shape; it should not assume every day has a valid high/low pair.

## Testing

Manual verification is sufficient for this repo because there is no automated test framework in place.

Validation checklist:

- Default render is Fahrenheit.
- Clicking `°C` changes all daily high/low labels to Celsius values.
- Clicking `°F` converts them back without reloading.
- Sample-data fallback still toggles correctly.
- The toggle remains readable and usable at mobile width.
- Keyboard users can tab to the control and activate it with Enter/Space.

## Implementation Notes

Files likely to change:

- `app.js` — add unit state, conversion helpers, toggle handler, and render logic
- `index.html` — add the toggle markup
- `styles.css` — add button styling and layout adjustments

## Success Criteria (Plain Language)

This feature is successful when a user can do the following without confusion:

- Open the app and see temperatures in Fahrenheit by default.
- Spot a clear toggle for `°F` and `°C` in the header area.
- Click `°C` and immediately see all daily temperatures change to a Celsius scale.
- Click `°F` again and see the values convert back to Fahrenheit.
- Use the app without reloading the page or fetching new data when toggling units.
- Keep the layout readable and usable on a phone-sized viewport.
- See the toggle work both when the live forecast loads and when the app falls back to sample data.
- Avoid any unexpected changes outside temperature display, such as new settings pages or saved preferences.

## Acceptance Criteria

- The user can switch between Fahrenheit and Celsius from the app UI.
- The forecast cards update immediately when the toggle is changed.
- The feature works for both live and sample-data modes.
- The default state remains Fahrenheit unless the user changes it.
- The segmented control is visible beside the location block and remains clean on mobile widths.
- The result is visually consistent with the app's existing design.
- The implementation does not add any persistence or new backend/state complexity beyond the session-local toggle.
