message=${1:-patch}
target=${2:-master}

git add ./
git commit -m "$message"
git push origin "$target"