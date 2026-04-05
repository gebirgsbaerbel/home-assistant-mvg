"""MVG Departures Card — serves the Lovelace card JS with no-cache headers."""
from __future__ import annotations

import logging

from homeassistant.components.http import StaticPathConfig
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import HomeAssistant

DOMAIN = "mvg_card"
_CARD_PATH = "/mvg_card/mvg-departures-card.js"
_CARD_URL  = "/mvg_card/mvg-departures-card.js?v=1"
_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Register the card JS as a no-cache static path and auto-add it as a Lovelace resource."""
    await hass.http.async_register_static_paths([
        StaticPathConfig(
            url_path=_CARD_PATH,
            path=hass.config.path("custom_components/mvg_card/www/mvg-departures-card.js"),
            cache_headers=False,
        ),
    ])

    if hass.is_running:
        await _async_ensure_lovelace_resource(hass)
    else:
        async def _on_started(event):
            await _async_ensure_lovelace_resource(hass)
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _on_started)

    return True


async def _async_ensure_lovelace_resource(hass: HomeAssistant) -> None:
    try:
        lovelace = hass.data.get("lovelace")
        if not lovelace:
            _LOGGER.warning("Lovelace not available; add %s as a module resource manually.", _CARD_URL)
            return
        resources = getattr(lovelace, "resources", None)
        if not resources:
            _LOGGER.warning("Lovelace resources unavailable; add %s as a module resource manually.", _CARD_URL)
            return
        await resources.async_load()
        if not any(r["url"] == _CARD_URL for r in resources.async_items()):
            await resources.async_create_item({"res_type": "module", "url": _CARD_URL})
            _LOGGER.info("Registered Lovelace resource: %s", _CARD_URL)
    except Exception as err:
        _LOGGER.warning("Could not auto-register Lovelace resource (%s); add %s manually.", err, _CARD_URL)
