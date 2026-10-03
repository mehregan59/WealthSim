/**
 * LangMixin.js
 *
 * Drop-in helper for any Phaser scene that needs translations.
 *
 * Usage inside a scene:
 *   // In create():
 *   this.t = (key) => Lang.t(key);
 *
 *   // Then use this.t() anywhere:
 *   this.add.text(x, y, this.t('level.1.title'), style);
 *
 * For live language switching (optional):
 *   LangMixin.watch(this, () => this.refreshText());
 *
 * This file is a convenience wrapper; all actual strings live in Lang.js.
 */

const LangMixin = {

  /**
   * Attach a t() shortcut to a Phaser scene.
   * Call once in the scene's create() method.
   *
   * @param {Phaser.Scene} scene
   */
  attach(scene) {
    scene.t = (key, langOverride) => Lang.t(key, langOverride);
    scene._langUnwatch = null;
  },

  /**
   * Register a callback that fires whenever the language changes mid-session.
   * Call after attach(). The callback typically re-builds scene text objects.
   *
   * @param {Phaser.Scene} scene
   * @param {Function} callback
   */
  watch(scene, callback) {
    const handler = (e) => {
      if (scene.scene && scene.scene.isActive()) callback(e.detail);
    };
    window.addEventListener('wealthsim:langchange', handler);
    // Store so the scene can clean up in shutdown():
    scene._langUnwatch = () => window.removeEventListener('wealthsim:langchange', handler);
  },

  /**
   * Remove the language-change listener. Call from scene's shutdown().
   *
   * @param {Phaser.Scene} scene
   */
  detach(scene) {
    if (scene._langUnwatch) {
      scene._langUnwatch();
      scene._langUnwatch = null;
    }
  },
};

window.LangMixin = LangMixin;
