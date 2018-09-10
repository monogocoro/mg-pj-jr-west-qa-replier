if ps x | grep -q "node\sclient.js"; then
    exit 0
else
    cd /usr/src/app/server/; /usr/local/bin/node client.js
    exit 1
fi
