# @narrative-studio/nlp

Python-based NLP analysis service for Narrative Studio.

## Features

- 剧情结构分析 (Plot Structure Analysis)
- 节奏分析 (Pacing Analysis)
- 冲突检测 (Conflict Detection)
- 角色弧光分析 (Character Arc Analysis)
- 三幕式结构识别 (Three-Act Structure)

## Setup

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Unix/macOS)
source venv/bin/activate

# Install dependencies
pip install -e .

# Download spaCy model (Chinese)
python -m spacy download zh_core_web_sm

# Or English model
python -m spacy download en_core_web_sm
```

## Usage

```python
from src import NarrativeAnalyzer

analyzer = NarrativeAnalyzer()
result = analyzer.analyze_structure("你的小说文本...")
print(result)
```

## Development

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Format code
black src/

# Lint
ruff check src/
```
