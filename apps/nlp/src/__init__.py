"""
Narrative Studio NLP Analysis Service

提供基于计算叙事学的文本分析功能：
- 剧情结构分析
- 节奏分析
- 冲突检测
- 角色弧光分析
- 三幕式结构识别
"""

from .analyzer import NarrativeAnalyzer

__version__ = "0.0.0"
__all__ = ["NarrativeAnalyzer"]
