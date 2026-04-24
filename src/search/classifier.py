from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

class DocumentClassifier:
    def __init__(self):
        # REQ-B41: Multinomial Naïve Bayes
        self.model = Pipeline([
            ('vectorizer', CountVectorizer()),
            ('nb', MultinomialNB())
        ])
        self.is_trained = False

    def train(self, texts, labels):
        """REQ-B42 & REQ-B44: Treino e Avaliação"""
        if len(set(labels)) < 2:
            return "Dados insuficientes (preciso de pelo menos 2 categorias diferentes)."
        
        X_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=0.2, random_state=42)
        self.model.fit(X_train, y_train)
        self.is_trained = True
        
        predictions = self.model.predict(X_test)
        return classification_report(y_test, predictions)

    def predict_category(self, text):
        """REQ-B43: Atribuição automática"""
        if not self.is_trained: return "N/A"
        return self.model.predict([text])[0]