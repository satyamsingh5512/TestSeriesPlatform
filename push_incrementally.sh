#!/bin/bash
echo "Temporarily caching credentials for 1 hour so you don't have to type your password 25 times..."
git config credential.helper 'cache --timeout=3600'

git log origin/main..main --reverse --format="%H" | while read commit; do
  echo "Pushing commit: $commit"
  git push origin "$commit:refs/heads/main"
  sleep 1
done

echo "All commits pushed incrementally!"
