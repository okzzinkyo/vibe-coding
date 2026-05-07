"""
[파일 목적]
예비 실험 결과를 시각화하여 논문용 그래프(PNG/PDF) 생성.
실행: python src/visualize.py
의존성: matplotlib, seaborn, pandas
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os
import json

def plot_performance_comparison():
    """
    각 모델별 Pass@1 및 실행 가능성(Executability) 비교 그래프 생성.
    """
    # 결과 로드
    with open('results/summary.json', 'r') as f:
        data = json.load(f)
    
    df = pd.DataFrame(data)
    
    # Seaborn 테마 설정 (색각이상자 친화적 팔레트)
    sns.set_theme(style="whitegrid", palette="colorblind")
    
    # 그래프 크기 및 폰트 설정
    plt.figure(figsize=(10, 6))
    plt.rcParams.update({'font.size': 12})
    
    # 데이터 변환 (Bar plot용)
    df_melt = df.melt(id_vars='Method', var_name='Metric', value_name='Score')
    
    # 시각화 (Grouping by Method and Metric)
    ax = sns.barplot(data=df_melt, x='Method', y='Score', hue='Metric')
    
    # 타이틀 및 축 레이블 (영어)
    plt.title('Performance Comparison of Code Generation Frameworks', fontsize=14, pad=20)
    plt.xlabel('Method', fontsize=12)
    plt.ylabel('Percentage (%)', fontsize=12)
    plt.ylim(0, 1.0)
    
    # 범례 위치
    plt.legend(title='Metrics', loc='upper left')
    
    # 300 DPI 저장 (PNG, PDF)
    os.makedirs('figures', exist_ok=True)
    plt.savefig('figures/performance_comparison.png', dpi=300, bbox_inches='tight')
    plt.savefig('figures/performance_comparison.pdf', bbox_inches='tight')
    
    print("Graphs saved to figures/ (PNG/PDF).")

if __name__ == "__main__":
    if os.path.exists('results/summary.json'):
        plot_performance_comparison()
    else:
        print("Error: No result file found. Run src/pilot_experiment.py first.")
