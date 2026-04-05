const MVG_LINE_COLORS = {
  // U-Bahn
  'U1': '#52822E',
  'U2': '#8B1A4A',
  'U3': '#F36F21',
  'U4': '#00A984',
  'U5': '#BF8326',
  'U6': '#0065AE',
  // S-Bahn
  'S1': '#5BA4D4',
  'S2': '#9F184C',
  'S3': '#612C85',
  'S4': '#E52225',
  'S6': '#2E7D32',
  'S7': '#952D4F',
  'S8': '#1A1A1A',
  'S20': '#EA6B00',
};

// Field names used in config for per-line color overrides
const LINE_COLOR_FIELDS = [
  'U1','U2','U3','U4','U5','U6',
  'S1','S2','S3','S4','S6','S7','S8','S20',
];

function rgbArrayToHex(val) {
  if (!Array.isArray(val)) return val;
  return '#' + val.map(c => Math.round(c).toString(16).padStart(2, '0')).join('');
}

const INBOUND_FIELDS = LINE_COLOR_FIELDS; // same set of lines

class MVGDeparturesCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._departures = [];
    this._lastUpdated = null;
  }

  setConfig(config) {
    if (!config.entity) throw new Error('entity is required (e.g. sensor.trudering)');
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const state = hass.states[this._config?.entity];
    const lastUpdated = state?.last_updated ?? null;
    if (lastUpdated !== this._lastUpdated) {
      this._lastUpdated = lastUpdated;
      this._departures = state?.attributes?.departures ?? [];
      this._render();
    }
  }

  _isInbound(dep) {
    const raw = this._config.into_town ?? '';
    if (!raw) return false;
    const keywords = raw.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    return keywords.some(k => dep.destination.trim().toLowerCase() === k);
  }

  _isFilteredOut(dep) {
    const raw = this._config.filter_out ?? '';
    if (!raw) return false;
    const keywords = raw.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    return keywords.some(k => dep.destination.trim().toLowerCase() === k);
  }

  _lineColor(line) {
    // Check per-line color fields set via visual editor (stored as lc_U2 etc.)
    const fieldVal = this._config[`lc_${line}`];
    if (fieldVal) return rgbArrayToHex(fieldVal);
    // Fall back to legacy line_colors YAML map, then built-in defaults
    const overrides = this._config.line_colors ?? {};
    return overrides[line] ?? MVG_LINE_COLORS[line] ?? 'var(--primary-color)';
  }

  _escapeHtml(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  _render() {
    if (!this._config) return;

    const c = this._config;
    const accentColor = c.accent_color || 'var(--primary-color)';
    const count = c.number ?? 5;
    const deps = this._departures.filter(d => !this._isFilteredOut(d)).slice(0, count);

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          overflow: hidden;
          background: color-mix(in srgb, var(--ha-card-background, var(--card-background-color, #ffffff)) 75%, transparent) !important;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .header {
          display: flex;
          align-items: center;
          padding: 16px 16px 8px;
          gap: 8px;
        }
        .header-icon {
          color: ${accentColor};
          --mdc-icon-size: 24px;
          flex-shrink: 0;
        }
        .header-title {
          flex-grow: 1;
          font-size: 1.4em;
          font-weight: 600;
          color: var(--primary-text-color);
        }
        .list {
          padding: 8px 12px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .row {
          display: flex;
          align-items: center;
          background: var(--secondary-background-color);
          border-radius: 32px;
          padding: 10px 18px 10px 10px;
          gap: 14px;
          min-height: 44px;
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
        }
        .line-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: #fff;
          flex-shrink: 0;
          font-size: 0.82em;
          letter-spacing: -0.5px;
        }
        .destination {
          flex-grow: 1;
          font-size: 1.1em;
          font-weight: 600;
          color: var(--primary-text-color);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .time {
          flex-shrink: 0;
          text-align: right;
          line-height: 1.1;
        }
        .time-value {
          font-size: 1.2em;
          font-weight: 700;
          color: var(--primary-text-color);
          display: block;
        }
        .time-unit {
          font-size: 0.75em;
          color: var(--secondary-text-color);
          display: block;
        }
        .direction-icon {
          flex-shrink: 0;
          color: ${accentColor};
          --mdc-icon-size: 20px;
          opacity: 0.85;
        }
        .empty {
          text-align: center;
          color: var(--secondary-text-color);
          padding: 24px;
          font-size: 0.9em;
        }
      </style>
      <ha-card>
        <div class="header">
          ${c.icon !== '' ? `<ha-icon class="header-icon" icon="${this._escapeHtml(c.icon ?? 'mdi:train')}"></ha-icon>` : ''}
          ${c.title !== '' ? `<span class="header-title">${this._escapeHtml(c.title ?? 'Departures')}</span>` : ''}
        </div>
        <div class="list">
          ${deps.length
            ? deps.map(dep => `
                <div class="row">
                  <div class="line-circle" style="background: ${this._lineColor(dep.line)}">${this._escapeHtml(dep.line)}</div>
                  <div class="destination">${this._escapeHtml(dep.destination)}</div>
                  ${this._isInbound(dep) ? `<ha-icon class="direction-icon" icon="mdi:city-variant"></ha-icon>` : ''}
                  <div class="time">
                    <span class="time-value">${dep.time_in_mins}</span>
                    <span class="time-unit">min</span>
                  </div>
                </div>`).join('')
            : '<div class="empty">No departures</div>'
          }
        </div>
      </ha-card>`;

    window.dispatchEvent(new Event('resize'));
  }

  getLayoutOptions() {
    const n = this._config?.number ?? 5;
    return { grid_rows: n + 1, grid_columns: 4, grid_min_rows: 3 };
  }

  static getConfigElement() {
    return document.createElement('mvg-departures-card-editor');
  }

  static getStubConfig() {
    return { entity: 'sensor.trudering', title: 'Trudering', number: 5 };
  }
}

class MVGDeparturesCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._formReady = false;
  }

  setConfig(config) {
    this._config = config;
    if (!this._formReady) {
      this._render();
    } else {
      // Just update data — don't rebuild the form or focus is lost on every keystroke
      const form = this.shadowRoot.querySelector('ha-form');
      if (form) form.data = this._config;
    }
  }

  set hass(hass) {
    this._hass = hass;
    const form = this.shadowRoot.querySelector('ha-form');
    if (form) form.hass = hass;
  }

  _schema() {
    return [
      { name: 'entity', required: true, selector: { entity: { domain: 'sensor' } } },
      { name: 'title', selector: { text: {} } },
      { name: 'icon', selector: { icon: {} } },
      { name: 'number', selector: { number: { min: 1, max: 20, mode: 'box' } } },
      { name: 'accent_color', selector: { text: {} } },
      { name: 'into_town', selector: { text: {} } },
      { name: 'filter_out', selector: { text: {} } },
    ];
  }

  _labels(schema) {
    const map = {
      entity: 'Entity',
      title: 'Title',
      icon: 'Icon',
      number: 'Number of departures',
      accent_color: 'Accent color (e.g. #ff8800, leave empty for default)',
      into_town: 'Into town (comma-separated destinations)',
      filter_out: 'Filter out (comma-separated destinations)',
    };
    return map[schema.name] ?? schema.name;
  }

  _render() {
    if (!this._config) return;
    this.shadowRoot.innerHTML = '<ha-form></ha-form>';
    this._formReady = true;
    const form = this.shadowRoot.querySelector('ha-form');
    form.hass = this._hass;
    form.data = this._config;
    form.schema = this._schema();
    form.computeLabel = (s) => this._labels(s);
    form.addEventListener('value-changed', (e) => {
      this._config = e.detail.value;
      this.dispatchEvent(new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      }));
    });
  }
}

customElements.define('mvg-departures-card-editor', MVGDeparturesCardEditor);
customElements.define('mvg-departures-card', MVGDeparturesCard);

window.customCards ??= [];
window.customCards.push({
  type: 'mvg-departures-card',
  name: 'MVG Departures Card',
  description: 'Shows upcoming departures from an MVG Live sensor',
});
