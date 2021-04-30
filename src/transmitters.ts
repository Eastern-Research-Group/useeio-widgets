import { ResultPerspective } from "./webapi";
import { Config, ConfigTransmitter, Widget, updateConfig } from "./widget";
import * as strings from "./util/strings";
import { isNone } from "./util/util";

/**
 * A simple `ConfigTransmitter` implementation that shares configuration
 * updates with the joined widgtes.
 */
 export class EventBus implements ConfigTransmitter {

    private readonly widgets = new Array<Widget>();
    private config: Config = {};

    join(widget: Widget) {
        if (!widget) {
            return;
        }
        this.widgets.push(widget);
        widget.onChanged(change => {
            updateConfig(this.config, change);
            this.update(this.config);
        });
    }

    update(config: Config) {
        this.config = config;
        for (const widget of this.widgets) {
            widget.update(config);
        }
    }
}

/**
 * A `ConfigTransmitter` implementation that reads and serializes
 * its configuration state from and to the hash part of the current
 * URL.
 */
 export class UrlConfigTransmitter implements ConfigTransmitter {

    private widgets = new Array<Widget>();
    private config: Config = {};
    private defaultConfig: Config;

    constructor() {
        this.config = this.parseUrlConfig({ withScripts: true });
        window.onhashchange = () => this.onHashChanged();
        window.addEventListener("popstate", () => this.onHashChanged());
        document.addEventListener("hashChangeEvent", () => this.onHashChanged());
    }

    /**
     * Returns the current configuration of this transmitter.
     */
    public get(): Config {
        return !this.defaultConfig
            ? { ...this.config }
            : { ...this.defaultConfig, ...this.config };
    }

    /**
     * Set the default configuration options of this transmitter. The default
     * values are not serialized in the hash part of the URL but are passed
     * to the joined widgets. The default configuration should be set before
     * widgets join this transmitter.
     */
    withDefaults(config: Config) {
        this.defaultConfig = config;
    }

    /**
     * Updates the configation of this transmitter if the given object contains
     * properties that are not already defined. Only if there is at least one
     * such property, an update is fired.
     */
    updateIfAbsent(conf: Config) {
        if (!conf) return;
        const next: Config = this.get();

        // set the values of c2 in c1 if they are missing in c1
        const sync = (c1: Config, c2: Config) => {
            let needsUpdate = false;
            for (const key of Object.keys(c2)) {
                if (key === "scopes") continue;
                if (!c1[key]) {
                    c1[key] = c2[key];
                    needsUpdate = true;
                }
            }
            if (!c2.scopes) {
                return needsUpdate;
            }
            if (!c1.scopes) {
                c1.scopes = { ...c2.scopes };
                return true;
            }
            // sync scope configs recursively
            for (const scope of Object.keys(c2.scopes)) {
                const cc1 = c1.scopes[scope];
                const cc2 = c2.scopes[scope];
                if (!cc2) {
                    continue;
                }
                if (!cc1) {
                    c1.scopes[scope] = { ...cc2 };
                    needsUpdate = true;
                    continue;
                }
                if (sync(cc1, cc2)) {
                    needsUpdate = true;
                }
            }
            return needsUpdate;
        };

        if (sync(next, conf)) {
            this.update(next);
        }
    }

    private onHashChanged() {
        this.config = this.parseUrlConfig();
        const config = this.get(); // add possible defaults
        for (const widget of this.widgets) {
            widget.update(config);
        }
    }

    clearAll() {
        window.location.hash = "";
    }

    /**
     * Let the given widget join this configuration transmitter. The widget
     * will be initialized with the current configuration of this transmitter.
     */
    join(widget: Widget) {
        this.widgets.push(widget);
        widget.update(this.get());
        widget.onChanged((config) => {
            this.update(config);
        });
    }

    update(config: Config) {
        const next: Config = this.get();
        updateConfig(next, config);
        this.config = next;
        this.updateHash();
    }

    private updateHash() {

        const str = (conf: Config, scope?: string) => {
            const parts = new Array<string>();
            const urlParam = (key: string, val: any) => {

                // only add it to the URL if it is not
                // defined as default value
                let defaultVal = this.defaultConfig
                    ? this.defaultConfig[key]
                    : null;
                if (defaultVal) {
                    if (Array.isArray(defaultVal)) {
                        defaultVal = defaultVal.join(",");
                    }
                    if (defaultVal === val) {
                        return;
                    }
                }

                scope
                    ? parts.push(`${scope}-${key}=${val}`)
                    : parts.push(`${key}=${val}`);
            };

            // add lists
            const lists = [
                "sectors",
                "indicators",
                "view_indicators",
                "naics",
                "view"
            ];
            for (const list of lists) {
                const val = conf[list] as string[];
                if (val) {
                    urlParam(list, val.join(","));
                }
            }

            // add simple types
            for (const key of Object.keys(conf)) {
                if (lists.indexOf(key) >= 0
                    || key === "scopes") {
                    continue;
                }
                const val = conf[key];
                if (val) {
                    urlParam(key, val);
                }
            }

            // add scopes
            if (conf.scopes) {
                for (const _scope of Object.keys(conf.scopes)) {
                    const scopeConf = conf.scopes[_scope];
                    if (scopeConf) {
                        parts.push(str(scopeConf, _scope));
                    }
                }
            }
            return parts.join("&");
        };

        this.patchHash(str(this.config));
    }

    /**
     * Update the current hash with the given value but keep current hash
     * attributes that are no configuration attributes in the hash. Note that
     * configuration attributes can be dropped intentionally from the hash part
     * (indicating that something is not set). Also, configuration attributes
     * can have scope prefixes. Thus, it is not enough to just keep the current
     * attributes in the has; we need to check for each current attribute if it
     * is a configuration attribute instead.
     */
    private patchHash(configHash: string) {
        const current = window.location.hash;
        if (strings.isNullOrEmpty(current) || current === "#") {
            window.location.hash = "#" + configHash;
            return;
        }
        const configKeys = [
            "model",
            "sectors",
            "naics",
            "indicators",
            "view_indicators",
            "perspective",
            "analysis",
            "year",
            "location",
            "count",
            "page",
            "view",
            "showvalues",
            "showscientific",
            "selectmatrix",
            "showdownload",
            "showcode",
        ];

        let prefix = "";
        const currentParts = current.substring(1).split("&");
        for (const part of currentParts) {
            const [key,] = part.split("=");
            let addIt = true;
            for (const configKey of configKeys) {
                if (key === configKey
                    || key.endsWith(`-${configKey}`)) {
                    addIt = false;
                    break;
                }
            }
            if (!addIt) {
                continue;
            }
            if (prefix.length > 0) {
                prefix += "&";
            }
            prefix += part;
        }

        window.location.hash = strings.isNullOrEmpty(prefix)
            ? `#${configHash}`
            : `#${prefix}&${configHash}`;
    }

    /**
     * Parses the URL configuration from the browser URL (window.location)
     * and optionally also from the URLs of included JavaScript files. Hash
     * parameters have a higher priority than normal URL parameters; the
     * browser URL has a higher priority that the URLs of included JavaScript
     * files.
     */
    private parseUrlConfig(what?: { withScripts?: boolean }): Config {
        const config: Config = {};
        const urls: string[] = [
            window.location.href,
        ];
        if (what && what.withScripts) {
            const scriptTags = document.getElementsByTagName("script");
            for (let i = 0; i < scriptTags.length; i++) {
                const url = scriptTags.item(i).src;
                if (url) {
                    urls.push(url);
                }
            }
        }

        // check for a global `hiddenhash` variable
        const hiddenhash = this.getHiddenHash();
        if (hiddenhash !== "") {
            urls.push("#" + hiddenhash);
        }

        for (const url of urls) {
            const hashParams = this.getParameters(this.getHashPart(url));
            const otherParams = this.getParameters(this.getParameterPart(url));
            this.updateConfig(config, hashParams);
            this.updateConfig(config, otherParams);
        }
        return config;
    }

    /**
     * We check for a global `hiddenhash` attribute for additional configuration
     * settings. This can be a string or an object with string values.
     */
    private getHiddenHash(): string {
        const hiddenhash = (window as any).hiddenhash;
        if (isNone(hiddenhash)) {
            return "";
        }
        if (typeof hiddenhash === "string") {
            return hiddenhash;
        }
        if (typeof hiddenhash === "object") {
            return Object.keys(hiddenhash)
                .map(key => `${key}=${hiddenhash[key]}`)
                .join("&");
        }
        return "";
    }

    /**
     * Updates the given configuration with the given URL parameters if and only
     * if the respective parameters are not already defined in that configuration.
     */
    private updateConfig(config: Config, urlParams: [string, string][]) {

        // create scoped configurations lazily
        const _conf = (scope?: string) => {
            if (!scope) {
                return config;
            }
            if (!config.scopes) {
                config.scopes = {};
            }
            let c = config.scopes[scope];
            if (!c) {
                c = {};
                config.scopes[scope] = c;
            }
            return c;
        };

        // update if a value is not set yet
        const _update = (key: string, value: any, scope?: string) => {
            const c = _conf(scope);
            if (c[key]) {
                return;
            }
            c[key] = value;
        };

        for (const [key, val] of urlParams) {
            if (!key) {
                continue;
            }
            let scope: string | undefined;
            let _key = key;
            const dashIdx = key.indexOf("-");
            if (dashIdx > 0) {
                scope = key.substring(0, dashIdx);
                _key = key.substring(dashIdx + 1);
            }

            switch (_key) {

                // simple string values
                case "model":
                case "location":
                    _update(_key, val, scope);
                    break;

                // integers
                case "year":
                case "count":
                case "page":
                    try {
                        const _int = parseInt(val, 10);
                        _update(_key, _int, scope);
                    } catch (_) { }
                    break;

                // booleans
                case "showvalues":
                case "showcode":
                case "selectmatrix":
                case "showdownload":
                case "showscientific":
                    const _bool = strings.eq(val, "true", "1", "yes");
                    _update(_key, _bool, scope);
                    break;

                // lists
                case "sectors":
                case "indicators":
                case "view_indicators":
                case "naics":
                case "view":
                    const _list = strings.isNullOrEmpty(val)
                        ? []
                        : val.split(",");
                    _update(_key, _list, scope);
                    break;

                case "type":
                case "analysis":
                    if (strings.eq(val, "consumption")) {
                        _update("analysis", "Consumption", scope);
                    } else if (strings.eq(val, "production")) {
                        _update("analysis", "Production", scope);
                    }
                    break;

                case "perspective":
                    const p = this.getPerspective(val);
                    if (p) {
                        _update("perspective", p, scope);
                    }
                    break;

                default:
                    break;
            }
        }
    }

    /**
     * Try to determine the result perspecitve from the value in the URL hash.
     */
    private getPerspective(val: string): ResultPerspective | null {
        if (!val) {
            return null;
        }
        switch (val.trim().toLowerCase()) {
            case "direct":
            case "direct results":
            case "supply":
            case "supply chain":
                return "direct";
            case "final":
            case "final results":
            case "consumption":
            case "final consumption":
            case "point of consumption":
                return "final";
            case "intermediate":
            case "intermediate results":
                return "intermediate";
            default:
                return null;
        }
    }

    private getParameters(urlPart: string): [string, string][] {
        if (!urlPart)
            return [];
        const pairs = urlPart.split("&");
        const params: [string, string][] = [];
        for (const pair of pairs) {
            const keyVal = pair.split("=");
            if (keyVal.length < 2) {
                continue;
            }
            const key = keyVal[0].trim().toLowerCase();
            const val = keyVal[1].trim();
            params.push([key, val]);
        }
        return params;
    }

    private getHashPart(url: string): string | null {
        if (!url)
            return null;
        const parts = url.split("#");
        return parts.length < 2
            ? null
            : parts[parts.length - 1];
    }

    private getParameterPart(url: string): string | null {
        if (!url)
            return null;
        let part = url;

        // remove the hash part
        let parts = url.split("#");
        if (parts.length > 1) {
            part = parts[parts.length - 2];
        }

        // get the parameter part
        parts = part.split("?");
        return parts.length < 2
            ? null
            : parts[1];
    }
}
