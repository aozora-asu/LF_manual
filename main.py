"""後方互換用エントリポイント。実際の起動は src/main.py で行う。"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from src.main import main

if __name__ == "__main__":
    main()
