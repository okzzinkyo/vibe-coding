import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# 1. 가상의 라이브러리 문서 (Z-Opt Library)
# LLM의 학습 데이터에 포함되지 않았다고 가정하는 최신/비공개 라이브러리 정보
corpus = [
    "The DataOptimizer class in Z-Opt library provides a prune(method, threshold) function. Supported methods are 'L1', 'L2', and 'Weight'.",
    "In Z-Opt, to initialize the optimizer, use ZOpt.initialize(api_key).",
    "Standard PyTorch pruning techniques include l1_unstructured and ln_structured.",
    "TensorFlow offers a model optimization toolkit for pruning and quantization.",
    "The prune function in Z-Opt requires a float value for the threshold parameter."
]

# 2. 사용자 쿼리
# "Z-Opt 라이브러리를 사용하여 L2 방식으로 threshold 0.5를 설정해 신경망을 프루닝하는 코드를 작성해줘."
query = "How to use the DataOptimizer class to prune a neural network with the L2 method and a threshold of 0.5 in the Z-Opt library?"

def run_pilot():
    print("Running Pilot Experiment: Baseline vs. RAG for Code Generation")
    print("-" * 50)
    
    # TF-IDF 기반 검색 시뮬레이션
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)
    query_vec = vectorizer.transform([query])
    
    # 코사인 유사도 계산
    similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()
    top_index = np.argmax(similarities)
    top_score = similarities[top_index]
    
    print(f"Query: {query}")
    print(f"Top Retrieved Doc Score: {top_score:.4f}")
    print(f"Top Retrieved Doc: {corpus[top_index]}")
    
    # 실험 결과 해석 (시뮬레이션)
    # Baseline: 검색 없이 생성 -> Z-Opt의 존재를 몰라 PyTorch나 TF 코드를 생성할 확률 높음 (정확도 낮음)
    # RAG: 검색된 문서를 참고하여 정확한 API(prune('L2', 0.5)) 호출 가능 (정확도 높음)
    
    baseline_accuracy = 0.15 # 가상 수치: 일반적인 지식에 의존
    rag_accuracy = 0.85      # 가상 수치: 검색된 컨텍스트에 의존
    
    print("-" * 50)
    print(f"Estimated Baseline Accuracy (Zero-shot): {baseline_accuracy * 100}%")
    print(f"Estimated RAG Accuracy (with Retrieval): {rag_accuracy * 100}%")
    print(f"Performance Improvement: {((rag_accuracy - baseline_accuracy) / baseline_accuracy) * 100:.2f}%")
    
if __name__ == "__main__":
    run_pilot()
