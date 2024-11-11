-- handler.lua
local AOlearn = require("@berry/AOlearn")
local json = require("json")

-- Initialize state
if not Handlers then Handlers = { } end

-- Add Lasso regression handler
Handlers.add("train", function(msg)
  -- Parse incoming data
  local data = json.decode(msg.Data)
  
  -- Validate input
  if not data or not data.X or not data.y then
    return { error = "Missing required data fields" }
  end

  -- Run Lasso regression
  local ok, weights, bias = pcall(function()
    return AOlearn.lasso.fit_lasso(data.X, data.y, data.alpha or 0.1)
  end)

  -- Handle computation result
  if not ok then
    return {
      ok = false,
      error = "Computation failed: " .. tostring(weights)
    }
  end

  -- Return success response
  return {
    ok = true,
    model = {
      coefficients = weights,
      intercept = bias,
      type = "lasso"
    },
    timestamp = os.time()
  }
end)