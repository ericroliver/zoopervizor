# Build and Publishing Guide

This guide covers building, packaging, and publishing the Zoopervizor VSCode extension.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Building the Extension](#building-the-extension)
- [Packaging the Extension](#packaging-the-extension)
- [Testing the Package](#testing-the-package)
- [Publishing to VS Code Marketplace](#publishing-to-vs-code-marketplace)
- [Version Management](#version-management)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should be 18.x or higher
   ```

2. **npm** (included with Node.js)
   ```bash
   npm --version
   ```

3. **vsce** (Visual Studio Code Extension Manager)
   ```bash
   npm install -g @vscode/vsce
   ```

4. **VSCode** (v1.85.0 or higher)
   ```bash
   code --version
   ```

### Optional Tools

- **Git** - For version control
- **GitHub CLI** - For release automation
- **TypeScript** - Installed locally as dev dependency

## Building the Extension

### 1. Install Dependencies

First time setup:
```bash
npm install
```

This installs:
- Production dependencies (Express, ws)
- Development dependencies (TypeScript, type definitions, vsce)

### 2. Compile TypeScript

Compile TypeScript source to JavaScript:
```bash
npm run compile
```

This:
- Runs `tsc -p ./` (TypeScript compiler)
- Compiles all `.ts` files in `src/` to `.js` in `out/`
- Generates source maps if configured
- Outputs any compilation errors

**Watch Mode** (auto-compile on file changes):
```bash
npm run watch
```

⚠️ **Note**: Watch mode is for development only. Stop it before packaging.

### 3. Verify Build

Check that compiled files exist:
```bash
ls -la out/
```

You should see:
```
out/
├── extension.js
├── api/
│   ├── server.js
│   ├── routes.js
│   └── ...
├── roo-code/
│   └── ...
└── ...
```

### 4. Lint Code (Optional but Recommended)

Check code quality:
```bash
npm run lint
```

Fix linting issues before packaging.

## Packaging the Extension

### 1. Pre-Publish Checks

Before packaging, ensure:

- [ ] All TypeScript code compiles without errors
- [ ] Version number in `package.json` is correct
- [ ] `CHANGELOG.md` is updated with new version
- [ ] `README.md` is current
- [ ] All tests pass (if applicable)
- [ ] No uncommitted changes that should be included

### 2. Update Version Number

**Manual Version Update**:
Edit `package.json`:
```json
{
  "version": "0.2.0"  // Update this
}
```

**Using npm version**:
```bash
# Patch version (0.1.0 → 0.1.1)
npm version patch

# Minor version (0.1.0 → 0.2.0)
npm version minor

# Major version (0.1.0 → 1.0.0)
npm version major
```

This automatically:
- Updates `package.json`
- Creates a git commit
- Creates a git tag

### 3. Package the Extension

Create the `.vsix` file:
```bash
npm run package
```

Or directly:
```bash
vsce package
```

This creates `zoopervizor-{version}.vsix` in the project root.

**Package with Pre-Release Flag**:
```bash
vsce package --pre-release
```

**Package with Specific Version**:
```bash
vsce package --version 0.2.0-beta.1
```

### 4. What Gets Packaged

The `.vsix` includes:
- ✅ Compiled JavaScript (`out/`)
- ✅ `package.json`
- ✅ `README.md`
- ✅ `LICENSE`
- ✅ `CHANGELOG.md`
- ✅ `node_modules/` (production dependencies only)

Excluded (via `.vscodeignore`):
- ❌ TypeScript source (`src/`)
- ❌ Development files (`.vscode/`, `tsconfig.json`)
- ❌ Documentation (`docs/`)
- ❌ Git files (`.git/`, `.gitignore`)
- ❌ Build artifacts (`*.map`)
- ❌ Existing `.vsix` files

### 5. Verify Package Contents

Inspect the package:
```bash
vsce ls
```

This lists all files that will be included in the package.

Check package size:
```bash
ls -lh zoopervizor-*.vsix
```

## Testing the Package

### 1. Install from VSIX

**Command Line Installation**:
```bash
code --install-extension zoopervizor-0.1.0.vsix
```

**VSCode UI Installation**:
1. Open VSCode
2. Go to Extensions view (`Ctrl+Shift+X`)
3. Click "..." menu → "Install from VSIX..."
4. Select the `.vsix` file

### 2. Test the Extension

After installation:

1. **Verify Activation**:
   - Restart VSCode
   - Check status bar for Zoopervizor indicator
   - Open Output panel: `Ctrl+Shift+P` → "Zoopervizor: Show Output"

2. **Test Commands**:
   - `Ctrl+Shift+P` → "Zoopervizor: Show Output"
   - `Ctrl+Shift+P` → "Zoopervizor: Toggle Status Bar"
   - `Ctrl+Shift+P` → "Zoopervizor: Restart API Server"

3. **Test API Server**:
   ```bash
   curl http://localhost:3737/health
   ```

4. **Check Configuration**:
   - File → Preferences → Settings
   - Search for "Zoopervizor"
   - Verify all settings appear

### 3. Uninstall Test Version

```bash
code --uninstall-extension zoopervizor.zoopervizor
```

## Publishing to VS Code Marketplace

### 1. Prerequisites for Publishing

1. **Personal Access Token (PAT)**:
   - Go to [Azure DevOps](https://dev.azure.com/)
   - Create a new organization if needed
   - Generate a PAT with "Marketplace (Manage)" scope
   - Save the token securely

2. **Publisher Account**:
   - Create a publisher at [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage)
   - Use a unique publisher ID (currently set to "zoopervizor" in `package.json`)

3. **Configure vsce**:
   ```bash
   vsce login <publisher-name>
   ```
   Enter your PAT when prompted.

### 2. Pre-Publishing Checklist

Before publishing, verify:

- [ ] Extension works correctly when installed from `.vsix`
- [ ] Version number follows [Semantic Versioning](https://semver.org/)
- [ ] `CHANGELOG.md` documents all changes
- [ ] `README.md` is comprehensive and up-to-date
- [ ] Screenshots/GIFs demonstrate key features (if applicable)
- [ ] License file is included
- [ ] No security vulnerabilities (`npm audit`)
- [ ] Extension doesn't expose sensitive data
- [ ] All external dependencies are necessary and safe

### 3. Publish to Marketplace

**First-Time Publish**:
```bash
vsce publish
```

**Update Existing Extension**:
```bash
# Patch version (0.1.0 → 0.1.1)
vsce publish patch

# Minor version (0.1.0 → 0.2.0)
vsce publish minor

# Major version (0.1.0 → 1.0.0)
vsce publish major
```

**Publish Specific Version**:
```bash
vsce publish 0.2.0
```

**Publish Pre-Release**:
```bash
vsce publish --pre-release
```

### 4. Post-Publishing

After publishing:

1. **Verify on Marketplace**:
   - Visit your extension page: `https://marketplace.visualstudio.com/items?itemName=zoopervizor.zoopervizor`
   - Check that description, screenshots, and version are correct

2. **Test Installation from Marketplace**:
   ```bash
   code --install-extension zoopervizor.zoopervizor
   ```

3. **Create GitHub Release**:
   - Tag the release: `git tag v0.1.0`
   - Push tag: `git push origin v0.1.0`
   - Create release on GitHub with changelog

4. **Announce Release**:
   - Update documentation
   - Notify users (if applicable)
   - Update project README with new version

## Version Management

### Semantic Versioning

Follow [Semantic Versioning 2.0.0](https://semver.org/):

- **Major** (1.0.0): Breaking changes, incompatible API changes
- **Minor** (0.1.0): New features, backwards-compatible
- **Patch** (0.0.1): Bug fixes, backwards-compatible

### Pre-Release Versions

For beta/alpha versions:
```
0.1.0-alpha.1
0.1.0-beta.1
0.1.0-rc.1
```

### Version Management Workflow

1. **Development**:
   - Work on `main` or feature branches
   - Version stays as `-dev` or `-next` in `package.json`

2. **Release Preparation**:
   - Update version number
   - Update `CHANGELOG.md`
   - Create release branch if needed

3. **Release**:
   - Tag version: `git tag v0.1.0`
   - Publish to marketplace
   - Merge to `main`

4. **Post-Release**:
   - Bump to next development version
   - Start new changelog section

## CI/CD Integration

### GitHub Actions

See [`.github/workflows/publish.yml`](../.github/workflows/publish.yml) for automated publishing.

**Automated Tasks**:
- ✅ Run tests on every commit
- ✅ Build on every push
- ✅ Package on release tags
- ✅ Publish to marketplace on release

**Manual Workflow**:
1. Create and push a version tag: `git tag v0.1.0 && git push origin v0.1.0`
2. GitHub Action automatically builds and publishes
3. GitHub Release is created with `.vsix` file attached

### Local Release Script

Create `scripts/release.sh`:
```bash
#!/bin/bash
set -e

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

echo "🚀 Releasing version $VERSION"

# Build
echo "📦 Building..."
npm run compile

# Package
echo "📦 Packaging..."
npm run package

# Create git tag
echo "🏷️  Creating git tag..."
git tag "v$VERSION"
git push origin "v$VERSION"

echo "✅ Released v$VERSION"
```

## Troubleshooting

### Build Issues

**Error: Cannot find module 'xyz'**
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Error: TypeScript compilation failed**
```bash
# Solution: Check for syntax errors
npm run compile
# Fix errors in source files
```

### Packaging Issues

**Error: Extension already exists**
```bash
# Solution: Remove old .vsix file
rm zoopervizor-*.vsix
npm run package
```

**Error: Missing files in package**
```bash
# Solution: Check .vscodeignore
# Ensure necessary files are NOT excluded
cat .vscodeignore
```

**Package size too large (>50MB)**
```bash
# Solution: Reduce dependencies or exclude unnecessary files
npm prune --production
# Check what's included:
vsce ls
```

### Publishing Issues

**Error: Personal access token is invalid**
```bash
# Solution: Login again with valid token
vsce logout
vsce login <publisher-name>
```

**Error: Extension validation failed**
```bash
# Solution: Fix validation errors
# Common issues:
# - Missing README.md
# - Invalid package.json
# - Broken activation events
```

**Error: Version already exists**
```bash
# Solution: Bump version number
npm version patch
vsce publish
```

### Installation Issues

**Extension doesn't activate after installation**
```bash
# Solution: Check activation events in package.json
# Ensure "onStartupFinished" or specific commands are listed
# Check VSCode Developer Tools console for errors
```

**API server doesn't start**
```bash
# Solution: Check logs
# Ctrl+Shift+P → "Zoopervizor: Show Output"
# Verify port is not in use:
lsof -i :3737
```

## Best Practices

### Before Every Release

1. ✅ Run full test suite
2. ✅ Update version number
3. ✅ Update CHANGELOG.md
4. ✅ Update README.md if needed
5. ✅ Run `npm audit` to check for vulnerabilities
6. ✅ Test installation from `.vsix`
7. ✅ Commit all changes
8. ✅ Create git tag
9. ✅ Package extension
10. ✅ Publish to marketplace

### Version Control

- Keep `main` branch stable
- Use feature branches for development
- Tag all releases: `v0.1.0`, `v0.2.0`, etc.
- Never force-push to `main`

### Security

- Never commit PAT tokens
- Use environment variables for secrets
- Run `npm audit` regularly
- Keep dependencies updated
- Review dependency licenses

### Documentation

- Keep README.md current with latest version
- Document all breaking changes
- Update API docs when API changes
- Include migration guides for major versions

## Additional Resources

- [VSCode Extension API](https://code.visualstudio.com/api)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce Documentation](https://github.com/microsoft/vscode-vsce)
- [Semantic Versioning](https://semver.org/)
- [Azure DevOps](https://dev.azure.com/)