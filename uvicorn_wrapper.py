#!/usr/bin/env python3
"""
Smart Uvicorn Wrapper for Railway & Cloud Container Deployments.
Intercepts literal '$PORT' or '${PORT}' CLI arguments and substitutes
them with the actual runtime port from the PORT environment variable.
"""
import os
import re
import sys

# Get actual PORT assigned by Railway or default to 8000
port_val = os.environ.get("PORT", "8000").strip()
if not port_val or not port_val.isdigit():
    port_val = "8000"

new_argv = []
for arg in sys.argv:
    if arg in ("$PORT", "${PORT}", "$port"):
        new_argv.append(port_val)
    elif arg.startswith("--port="):
        val = arg.split("=", 1)[1]
        if val in ("$PORT", "${PORT}", "$port") or not val.isdigit():
            new_argv.append(f"--port={port_val}")
        else:
            new_argv.append(arg)
    else:
        new_argv.append(arg)

sys.argv = new_argv

from uvicorn.main import main

if __name__ == "__main__":
    sys.argv[0] = re.sub(r'(-script\.pyw|\.exe)?$', '', sys.argv[0])
    sys.exit(main())
