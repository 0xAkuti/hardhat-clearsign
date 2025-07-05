# Generate 7730 Plugin

A basic Hardhat 3 plugin that adds a `generate-7730` task that executes Python commands.

## Features

- Adds a new task called `generate-7730`
- Executes Python commands using `uvx pycowsay Hello from Hardhat`
- Supports detailed output with the `--detail` flag
- Built for Hardhat 3 using the new plugin architecture
- Hooks into compilation process with the `--generate-7-7-3-0` global flag

## Usage

### Standalone Task

Run the task with:

```bash
npx hardhat generate-7730
```

Run with detailed output:

```bash
npx hardhat generate-7730 --detail
```

### Compilation Hook

Run automatically after compilation:

```bash
npx hardhat compile --generate-7-7-3-0
```

This will compile your contracts and then automatically run the generate-7730 task.

Note: The flag name is displayed as `--generate-7-7-3-0` in the CLI (kebab-case) but defined as `generate7730` in the code (camelCase).

## Plugin Structure

```
plugin/
├── index.ts              # Main plugin export
├── tasks/
│   └── generate-7730.ts  # Task definition
├── actions/
│   └── generate-7730.ts  # Task action logic
├── hook-handlers/
│   └── solidity.ts       # Solidity compilation hooks
└── README.md            # This file
```

## Integration

The plugin is registered in `hardhat.config.ts`:

```typescript
import generate7730Plugin from "./plugin/index.js";

const config: HardhatUserConfig = {
  plugins: [generate7730Plugin],
  // ... other config
};
```

## Development

To extend this plugin:

1. Modify the Python command in `actions/generate-7730.ts` (currently uses `uvx pycowsay Hello from Hardhat`)
2. Add additional flags or parameters in `tasks/generate-7730.ts`
3. Create additional tasks by adding them to the `tasks` array in `index.ts`

## Requirements

- Node.js with child_process support
- `uvx` and `pycowsay` for the Python command (or replace with your own command) 