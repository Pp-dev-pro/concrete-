/* No secrets live in this file, so it is safe to publish to Git.
   Tokens and endpoint keys are typed into the app at run time. */
window.APP_CONFIG = {
  defaultUrl: "https://api.catalyst.zoho.in/quickml/v1/project/84405000000016025/endpoints/predict",
  defaultOrg: "60092144905",
  defaultEnv: "Development",
  models: [
    { id: "xgb", name: "XGBoost",  blurb: "Gradient-boosted trees", color: "#ffb020", keyField: "fKey1" },
    { id: "m2",  name: "Model 2",  blurb: "Second regression model", color: "#3ddbc0", keyField: "fKey2" }
  ]
};
