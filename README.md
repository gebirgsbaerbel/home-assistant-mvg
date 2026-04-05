# MVG Departures Card

A Home Assistant custom integration that provides a Lovelace card for displaying live MVG (Münchner Verkehrsgesellschaft) departures.

## Features

- Shows upcoming departures with colored line circles (U-Bahn, S-Bahn)
- Built-in Munich line colors for all U-Bahn and S-Bahn lines
- Marks inbound (into town) departures with a city icon
- Filters out unwanted destinations
- Built-in Lovelace card — no extra card dependencies needed
- Auto-registers the Lovelace resource on setup

## Prerequisites

This card requires the [MVG Live integration](https://www.home-assistant.io/integrations/mvglive/) to be installed and configured. Follow the installation steps there, then add the following to your `configuration.yaml`:

```yaml
sensor:
  - platform: mvglive
    nextdeparture:
      - station: de:09162:920
        name: Trudering
        products: ["S-Bahn", "U-Bahn"]
        number: 10
```

> **Note:** Set `number` to at least `10`. The MVG API applies the limit before filtering by transport type, so a low number may result in no departures being returned for certain lines.

## Installation via HACS

1. In HACS, go to **Integrations** and click the three-dot menu → **Custom repositories**
2. Add this repository URL and select category **Integration**
3. Install **MVG Departures Card**
4. Restart Home Assistant

## Setup

Add `mvg_card:` to your `configuration.yaml`:

```yaml
mvg_card:
```

Restart Home Assistant. The Lovelace resource is registered automatically.

## Lovelace card

```yaml
type: custom:mvg-departures-card
entity: sensor.trudering
title: Trudering
```

### All configuration options

```yaml
type: custom:mvg-departures-card
entity: sensor.trudering
title: Trudering
icon: mdi:train
number: 5
accent_color: "#0065AE"
into_town: "Hauptbahnhof, Ostbahnhof"
filter_out: "Feldkirchen"
```

| Option | Description | Default |
|---|---|---|
| `entity` | MVG Live sensor entity (required) | — |
| `title` | Card title | `Departures` |
| `icon` | Header icon | `mdi:train` |
| `number` | Number of departures to show | `5` |
| `accent_color` | CSS color for icons and highlights (leave empty for theme default) | `var(--primary-color)` |
| `into_town` | Comma-separated list of inbound destinations — matching departures get a city icon | — |
| `filter_out` | Comma-separated list of destinations to hide entirely | — |

Destination matching for `into_town` and `filter_out` is case-insensitive and uses exact equality (trimmed).
