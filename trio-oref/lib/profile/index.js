

var basal = require('./basal');
var targets = require('./targets');
var isf = require('./isf');
var carb_ratios = require('./carbs');
var _ = require('lodash');

function defaults ( ) {
  return /* profile */ {
    max_iob: 0 // if max_iob is not provided, will default to zero
    , max_daily_safety_multiplier: 3
    , current_basal_safety_multiplier: 4
    , autosens_max: 1.2
    , autosens_min: 0.7
    , rewind_resets_autosens: true // reset autosensitivity to neutral for awhile after each pump rewind
    // , autosens_adjust_targets: false // when autosens detects sensitivity/resistance, also adjust BG target accordingly
    , high_temptarget_raises_sensitivity: false // raise sensitivity for temptargets >= 101.  synonym for exercise_mode
    , low_temptarget_lowers_sensitivity: false // lower sensitivity for temptargets <= 99.
    , sensitivity_raises_target: false // raise BG target when autosens detects sensitivity
    , resistance_lowers_target: false // lower BG target when autosens detects resistance
    , exercise_mode: false // when true, > 100 mg/dL high temp target adjusts sensitivityRatio for exercise_mode. This majorly changes the behavior of high temp targets from before. synonmym for high_temptarget_raises_sensitivity
    , half_basal_exercise_target: 160 // when temptarget is 160 mg/dL *and* exercise_mode=true, run 50% basal at this level (120 = 75%; 140 = 60%)
    // create maxCOB and default it to 120 because that's the most a typical body can absorb over 4 hours.
    // (If someone enters more carbs or stacks more; OpenAPS will just truncate dosing based on 120.
    // Essentially, this just limits AMA/SMB as a safety cap against excessive COB entry)
    , maxCOB: 120
    , maxMealAbsorptionTime: 6 // Handling of long lasting effects of "heavy meals" containing large cqantities of fat and protein might be improved by letting the system consider meal effects for longer than the default six hours.
    , skip_neutral_temps: false // if true, don't set neutral temps
    , unsuspend_if_no_temp: false // if true, pump will un-suspend after a zero temp finishes
    , min_5m_carbimpact: 8 // mg/dL per 5m (8 mg/dL/5m corresponds to 24g/hr at a CSF of 4 mg/dL/g (x/5*60/4))
    , autotune_isf_adjustmentFraction: 1.0 // keep autotune ISF closer to pump ISF via a weighted average of fullNewISF and pumpISF.  1.0 allows full adjustment, 0 is no adjustment from pump ISF.
    , remainingCarbsFraction: 1.0 // fraction of carbs we'll assume will absorb over 4h if we don't yet see carb absorption
    , remainingCarbsCap: 90 // max carbs we'll assume will absorb over 4h if we don't yet see carb absorption
    // WARNING: use SMB with caution: it can and will automatically bolus up to max_iob worth of extra insulin
    , enableUAM: false // enable detection of unannounced meal carb absorption
    , A52_risk_enable: false
    , enableSMB_with_COB: false // enable supermicrobolus while COB is positive
    , enableSMB_with_temptarget: false // enable supermicrobolus for eating soon temp targets
    // *** WARNING *** DO NOT USE enableSMB_always or enableSMB_after_carbs with Libre or similar
    // LimiTTer, etc. do not properly filter out high-noise SGVs.  xDrip+ builds greater than or equal to
    // version number d8e-7097-2018-01-22 provide proper noise values, so that oref0 can ignore high noise
    // readings, and can temporarily raise the BG target when sensor readings have medium noise,
    // resulting in appropriate SMB behaviour.  Older versions of xDrip+ should not be used with enableSMB_always.
    // Using SMB overnight with such data sources risks causing a dangerous overdose of insulin
    // if the CGM sensor reads falsely high and doesn't come down as actual BG does
    , enableSMB_always: false // always enable supermicrobolus (unless disabled by high temptarget)
    , enableSMB_after_carbs: false // enable supermicrobolus for 6h after carbs, even with 0 COB
    , enableSMB_high_bg: false // enable SMBs when a high BG is detected, based on the high BG target (adjusted or profile)
    , enableSMB_high_bg_target: 110 // set the value enableSMB_high_bg will compare against to enable SMB. If BG > than this value, SMBs should enable.
    // *** WARNING *** DO NOT USE enableSMB_always or enableSMB_after_carbs with Libre or similar.
    , allowSMB_with_high_temptarget: false // allow supermicrobolus (if otherwise enabled) even with high temp targets
    , maxSMBBasalMinutes: 30 // maximum minutes of basal that can be delivered as a single SMB with uncovered COB
    , maxUAMSMBBasalMinutes: 30 // maximum minutes of basal that can be delivered as a single SMB when IOB exceeds COB
    , SMBInterval: 3 // minimum interval between SMBs, in minutes.
    , bolus_increment: 0.1 // minimum bolus that can be delivered as an SMB
    , maxDelta_bg_threshold: 0.2 // maximum change in bg to use SMB, above that will disable SMB
    , curve: "rapid-acting" // change this to "ultra-rapid" for Fiasp, or "bilinear" for old curve
    , useCustomPeakTime: false // allows changing insulinPeakTime
    , insulinPeakTime: 75 // number of minutes after a bolus activity peaks.  defaults to 55m for Fiasp if useCustomPeakTime: false
    , carbsReqThreshold: 1 // grams of carbsReq to trigger a pushover
    , offline_hotspot: false // enabled an offline-only local wifi hotspot if no Internet available
    , noisyCGMTargetMultiplier: 1.3 // increase target by this amount when looping off raw/noisy CGM data
    , suspend_zeros_iob: true // recognize pump suspends as non insulin delivery events
    // send the glucose data to the pump emulating an enlite sensor. This allows to setup high / low warnings when offline and see trend.
    // To enable this feature, enable the sensor, set a sensor with id 0000000, go to start sensor and press find lost sensor.
    , enableEnliteBgproxy: false
    // TODO: make maxRaw a preference here usable by oref0-raw in myopenaps-cgm-loop
    //, maxRaw: 200 // highest raw/noisy CGM value considered safe to use for looping
    , calc_glucose_noise: false
    , target_bg: false // set to an integer value in mg/dL to override pump min_bg
    , smb_delivery_ratio: 0.5 //Default value: 0.5 Used if flexible delivery ratio is not used. This is another key OpenAPS safety cap, and specifies what share of the total insulin required can be delivered as SMB. This is to prevent people from getting into dangerous territory by setting SMB requests from the caregivers phone at the same time. Increase this experimental value slowly and with caution.
    , adjustmentFactor: 0.8
    , adjustmentFactorSigmoid: 0.5
    , useNewFormula: false
    , sigmoid: false
    , weightPercentage: 0.65
    , tddAdjBasal: false // Enable adjustment of basal based on the ratio of 24 h : 10 day average TDD
    , threshold_setting: 60 // Use a configurable threshold setting
  }
}

function displayedDefaults () {
    var allDefaults = defaults();
    var profile = { };

    profile.max_iob = allDefaults.max_iob;
    profile.max_daily_safety_multiplier = allDefaults.max_daily_safety_multiplier;
    profile.current_basal_safety_multiplier= allDefaults.current_basal_safety_multiplier;
    profile.autosens_max = allDefaults.autosens_max;
    profile.autosens_min = allDefaults.autosens_min;
    profile.rewind_resets_autosens = allDefaults.rewind_resets_autosens;
    profile.exercise_mode = allDefaults.exercise_mode;
    profile.sensitivity_raises_target = allDefaults.sensitivity_raises_target;
    profile.unsuspend_if_no_temp = allDefaults.unsuspend_if_no_temp;
    profile.enableSMB_with_COB = allDefaults.enableSMB_with_COB;
    profile.enableSMB_with_temptarget = allDefaults.enableSMB_with_temptarget;
    profile.enableUAM = allDefaults.enableUAM;
    profile.curve = allDefaults.curve;
    profile.offline_hotspot = allDefaults.offline_hotspot;
    profile.bolus_increment = allDefaults.bolus_increment;
    profile.smb_delivery_ratio = allDefaults.smb_delivery_ratio;
    profile.maxDelta_bg_threshold = allDefaults.maxDelta_bg_threshold;
    profile.adjustmentFactor = allDefaults.adjustmentFactor;
    profile.adjustmentFactorSigmoid = allDefaults.adjustmentFactorSigmoid;
    profile.useNewFormula = allDefaults.useNewFormula;
    profile.sigmoid = allDefaults.sigmoid;
    profile.weightPercentage = allDefaults.weightPercentage;
    profile.tddAdjBasal = allDefaults.tddAdjBasal;
    profile.threshold_setting = allDefaults.threshold_setting;
    profile.enableSMB_high_bg = allDefaults.enableSMB_high_bg;
    profile.enableSMB_high_bg_target = allDefaults.enableSMB_high_bg_target;
    profile.maxCOB = allDefaults.maxCOB;
    profile.maxMealAbsorptionTime = allDefaults.maxMealAbsorptionTime;

    console.error(profile);
    return profile
}

function generate (inputs, opts) {
  var profile = opts && opts.type ? opts : defaults( );

  // check if inputs has overrides for any of the default prefs
  // and apply if applicable
  for (var pref in profile) {
    if (inputs.hasOwnProperty(pref)) {
      profile[pref] = inputs[pref];
    }
  }

  var pumpsettings_data = inputs.settings;
  if (inputs.settings.insulin_action_curve > 1) {
    profile.dia =  pumpsettings_data.insulin_action_curve;
  } else {
    console.error('DIA of', profile.dia, 'is not supported');
    return -1;
  }

  if (inputs.model) {
    profile.model = inputs.model;
  }
  profile.skip_neutral_temps = inputs.skip_neutral_temps;

  profile.current_basal = basal.basalLookup(inputs.basals);
  profile.basalprofile = inputs.basals;

  _.forEach(profile.basalprofile, function(basalentry) {
    basalentry.rate = +(Math.round(basalentry.rate + "e+3")  + "e-3");
  });

  profile.max_daily_basal = basal.maxDailyBasal(inputs);
  profile.max_basal = basal.maxBasalLookup(inputs);
  if (profile.current_basal === 0) {
    console.error("current_basal of",profile.current_basal,"is not supported");
    return -1;
  }
  if (profile.max_daily_basal === 0) {
    console.error("max_daily_basal of",profile.max_daily_basal,"is not supported");
    return -1;
  }
  if (profile.max_basal < 0.1) {
    console.error("max_basal of",profile.max_basal,"is not supported");
    return -1;
  }

  var range = targets.bgTargetsLookup(inputs, profile);
  profile.out_units = inputs.targets.user_preferred_units;
  profile.min_bg = Math.round(range.min_bg);
  profile.max_bg = Math.round(range.max_bg);
  profile.bg_targets = inputs.targets;

  _.forEach(profile.bg_targets.targets, function(bg_entry) {
    bg_entry.high = Math.round(bg_entry.high);
    bg_entry.low = Math.round(bg_entry.low);
    bg_entry.min_bg = Math.round(bg_entry.min_bg);
    bg_entry.max_bg = Math.round(bg_entry.max_bg);
  });

  delete profile.bg_targets.raw;

  profile.temptargetSet = range.temptargetSet;
  profile.sens = isf.isfLookup(inputs.isf);
  profile.isfProfile = inputs.isf;
  if (profile.sens < 5) {
    console.error("ISF of",profile.sens,"is not supported");
    return -1;
  }
  if (typeof(inputs.carbratio) !== "undefined") {
    profile.carb_ratio = carb_ratios.carbRatioLookup(inputs, profile);
    profile.carb_ratios = inputs.carbratio;
  } else {
    console.error("Profile wasn't given carb ratio data, cannot calculate carb_ratio");
  }
  return profile;
}


generate.defaults = defaults;
generate.displayedDefaults = displayedDefaults;
exports = module.exports = generate;
