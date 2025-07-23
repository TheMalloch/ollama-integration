# Message Verification Features

This extension now includes several ways to verify what information is transmitted to the LLM before sending:

## 🔍 Preview Commands

### 1. `ollama.previewMessage`
- **Access**: Right-click in editor → "Prévisualiser le message pour Ollama"
- **Function**: Shows exactly what will be sent to Ollama
- **Content**: Includes analysis summary + full message preview
- **Benefits**: See all dependencies, functions, and code context before sending

### 2. Automatic Preview Mode
- **Setting**: `ollama.showPreviewBeforeSending` (default: false)
- **Function**: Automatically shows confirmation dialog before sending
- **Options**:
  - **Envoyer**: Send directly to Ollama
  - **Prévisualiser**: View full message in side panel
  - **Résumé**: View analysis summary only
  - **Annuler**: Cancel the operation

## 📊 Analysis Summary

The preview includes a detailed breakdown:

### Dependencies Section
- List of all local dependencies analyzed
- Import types (named, default, namespace)
- Code size for each dependency
- Sub-dependencies tree

### Function Calls
- All detected function calls with line numbers
- Origin classification (local, imported, builtin)
- Function parameters and context

### Variables Analysis
- Most used variables with usage counts
- Variable types and declarations
- Line number references

### Code Structure
- Functions, classes, and control structures
- File organization overview

## ⚙️ Configuration Options

```json
{
  "ollama.useFullContext": true,           // Enable smart analysis
  "ollama.showPreviewBeforeSending": false // Enable automatic preview
}
```

## 🎛️ Quick Access

### Status Bar
- Shows current mode (Smart/Basic) and preview status
- Eye icon (👁️) indicates preview mode is active
- Click to toggle between modes

### Toggle Commands
- `ollama.toggleFullContext`: Switch between smart/basic analysis
- `ollama.togglePreview`: Enable/disable preview confirmations

## 📈 Message Statistics

Every preview shows:
- Total character count
- Number of dependencies included
- Number of function calls detected
- Code blocks count
- Total lines

## 🛡️ Privacy Benefits

1. **Full Transparency**: See exactly what context is being sent
2. **Selective Sending**: Cancel if too much sensitive information is included
3. **Dependency Control**: Understand which files are being analyzed
4. **Size Awareness**: Know the scope of information transmitted

## 🚀 Usage Workflow

1. **Enable Preview Mode**: Set `ollama.showPreviewBeforeSending: true`
2. **Select Code**: Choose the code you want to analyze
3. **Send Command**: Use "Envoyer vers Ollama"
4. **Review Summary**: Check the analysis breakdown
5. **Preview if Needed**: View full message content
6. **Confirm or Cancel**: Make informed decision

This ensures you always know what information is being shared with the LLM while maintaining the power of intelligent code analysis.
