#!/bin/bash
cp tradematrix.js tradematrix.build.js
sed -i "s/__TM_USER__/$TM_USER/g" tradematrix.build.js
sed -i "s/__TM_PASS__/$TM_PASS/g" tradematrix.build.js
mv tradematrix.build.js tradematrix.js
echo "Build complete — credentials injected"