const { withMainActivity } = require('@expo/config-plugins');

const withHeavySleeper = (config) => {
    return withMainActivity(config, async (config) => {
        let src = config.modResults.contents;

        // Check if code is already present to avoid duplication
        if (!src.includes('setShowWhenLocked(true)')) {
            const newCode = `
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    }
    window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            android.view.WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
            android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
      `;

            // Inject after super.onCreate(null) or super.onCreate(savedInstanceState)
            if (src.includes('super.onCreate(null)')) {
                src = src.replace('super.onCreate(null)', 'super.onCreate(null)' + newCode);
            } else if (src.includes('super.onCreate(savedInstanceState)')) {
                src = src.replace('super.onCreate(savedInstanceState)', 'super.onCreate(savedInstanceState)' + newCode);
            }

            config.modResults.contents = src;
        }
        return config;
    });
};

module.exports = withHeavySleeper;
