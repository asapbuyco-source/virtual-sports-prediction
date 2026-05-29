#!/usr/bin/env python3
"""
ML Training Script for Virtual Sports Prediction
Trains models on betpawa_history.json data and exports predictions
"""

import json
import math
from collections import defaultdict
from datetime import datetime
import random
import os

random.seed(42)

# Load data
def load_data():
    with open('data/betpawa_history.json', 'r') as f:
        return json.load(f)

# Calculate ELO ratings
def calculate_elo(history):
    INITIAL_ELO = 1500
    K_FACTOR = 32
    
    elo_ratings = defaultdict(lambda: INITIAL_ELO)
    
    for day in history:
        for match in day['matches']:
            teams = match['teams'].split('-')
            if len(teams) != 2:
                continue
            home_team = teams[0].strip()
            away_team = teams[1].strip()
            
            scores = match['score'].split('-')
            if len(scores) != 2:
                continue
            try:
                home_score = int(scores[0].strip())
                away_score = int(scores[1].strip())
            except:
                continue
            
            # Calculate expected outcomes
            home_elo = elo_ratings[home_team]
            away_elo = elo_ratings[away_team]
            
            expected_home = 1 / (1 + 10 ** ((away_elo - home_elo) / 400))
            expected_away = 1 - expected_home
            
            # Actual outcome
            if home_score > away_score:
                actual_home = 1
            elif home_score == away_score:
                actual_home = 0.5
            else:
                actual_home = 0
            
            # Update ELO
            elo_ratings[home_team] += K_FACTOR * (actual_home - expected_home)
            elo_ratings[away_team] += K_FACTOR * ((1 - actual_home) - expected_away)
    
    return dict(elo_ratings)

# Calculate team statistics
def calculate_team_stats(history):
    stats = defaultdict(lambda: {
        'matches': 0,
        'wins': 0,
        'draws': 0,
        'losses': 0,
        'goals_scored': 0,
        'goals_conceded': 0,
        'over25': 0,
        'under25': 0,
        'btts_yes': 0,
        'btts_no': 0,
        'clean_sheets': 0,
        'failed_to_score': 0,
        'home_wins': 0,
        'away_wins': 0,
        'recent_form': [],
        'streak': 0,
        'h2h': defaultdict(lambda: {'wins': 0, 'draws': 0, 'losses': 0, 'goals_for': 0, 'goals_against': 0})
    })
    
    league_stats = defaultdict(lambda: {'total_goals': 0, 'total_matches': 0})
    
    for day in history:
        league = day['leagueName']
        
        for match in day['matches']:
            teams = match['teams'].split('-')
            if len(teams) != 2:
                continue
            home_team = teams[0].strip()
            away_team = teams[1].strip()
            
            scores = match['score'].split('-')
            if len(scores) != 2:
                continue
            try:
                home_score = int(scores[0].strip())
                away_score = int(scores[1].strip())
            except:
                continue
            
            # Update stats
            stats[home_team]['matches'] += 1
            stats[away_team]['matches'] += 1
            stats[home_team]['goals_scored'] += home_score
            stats[home_team]['goals_conceded'] += away_score
            stats[away_team]['goals_scored'] += away_score
            stats[away_team]['goals_conceded'] += home_score
            
            total_goals = home_score + away_score
            league_stats[league]['total_goals'] += total_goals
            league_stats[league]['total_matches'] += 1
            
            if home_score > away_score:
                stats[home_team]['wins'] += 1
                stats[home_team]['home_wins'] += 1
                stats[away_team]['losses'] += 1
            elif home_score == away_score:
                stats[home_team]['draws'] += 1
                stats[away_team]['draws'] += 1
            else:
                stats[away_team]['wins'] += 1
                stats[away_team]['away_wins'] += 1
                stats[home_team]['losses'] += 1
            
            if total_goals > 2.5:
                stats[home_team]['over25'] += 1
                stats[away_team]['over25'] += 1
            else:
                stats[home_team]['under25'] += 1
                stats[away_team]['under25'] += 1
            
            if home_score > 0 and away_score > 0:
                stats[home_team]['btts_yes'] += 1
                stats[away_team]['btts_yes'] += 1
            else:
                stats[home_team]['btts_no'] += 1
                stats[away_team]['btts_no'] += 1
            
            if away_score == 0:
                stats[home_team]['clean_sheets'] += 1
            if home_score == 0:
                stats[away_team]['clean_sheets'] += 1
            if home_score == 0:
                stats[away_team]['failed_to_score'] += 1
            if away_score == 0:
                stats[home_team]['failed_to_score'] += 1
            
            # H2H
            h2h_key = tuple(sorted([home_team, away_team]))
            if home_score > away_score:
                stats[h2h_key[0] if h2h_key[0] == home_team else h2h_key[1]]['h2h'][h2h_key]['wins'] += 1
            elif home_score == away_score:
                stats[h2h_key[0]]['h2h'][h2h_key]['draws'] += 1
                stats[h2h_key[1]]['h2h'][h2h_key]['draws'] += 1
            else:
                stats[h2h_key[0] if h2h_key[0] == away_team else h2h_key[1]]['h2h'][h2h_key]['wins'] += 1
            
            stats[home_team]['h2h'][h2h_key]['goals_for'] += home_score
            stats[home_team]['h2h'][h2h_key]['goals_against'] += away_score
            stats[away_team]['h2h'][h2h_key]['goals_for'] += away_score
            stats[away_team]['h2h'][h2h_key]['goals_against'] += home_score
    
    # Calculate derived stats
    for team in stats:
        s = stats[team]
        s['avg_goals_scored'] = s['goals_scored'] / max(s['matches'], 1)
        s['avg_goals_conceded'] = s['goals_conceded'] / max(s['matches'], 1)
        s['win_rate'] = s['wins'] / max(s['matches'], 1)
        s['over25_rate'] = s['over25'] / max(s['matches'], 1)
        s['btts_rate'] = s['btts_yes'] / max(s['matches'], 1)
        s['clean_sheet_rate'] = s['clean_sheets'] / max(s['matches'], 1)
        
        # Recent form (last 5)
        s['recent_form'] = s['recent_form'][-5:] if s['recent_form'] else []
        
        # Streak
        if len(s['recent_form']) >= 3:
            if s['recent_form'][-1] == s['recent_form'][-2] == s['recent_form'][-3]:
                s['streak'] = 3 if s['recent_form'][-1] == 'W' else -3
            else:
                s['streak'] = 0
        else:
            s['streak'] = 0
    
    return dict(stats), dict(league_stats)

# Generate training data
def generate_training_data(history, elo_ratings, team_stats, league_stats):
    X = []
    y_home_win = []
    y_over25 = []
    y_btts = []
    y_score = []
    
    for day in history:
        league = day['leagueName']
        league_avg = league_stats[league]['total_goals'] / max(league_stats[league]['total_matches'], 1) if league in league_stats else 2.5
        
        for match in day['matches']:
            teams = match['teams'].split('-')
            if len(teams) != 2:
                continue
            home_team = teams[0].strip()
            away_team = teams[1].strip()
            
            scores = match['score'].split('-')
            if len(scores) != 2:
                continue
            try:
                home_score = int(scores[0].strip())
                away_score = int(scores[1].strip())
            except:
                continue
            
            # Features
            home_elo = elo_ratings.get(home_team, 1500)
            away_elo = elo_ratings.get(away_team, 1500)
            home_stats = team_stats.get(home_team, {})
            away_stats = team_stats.get(away_team, {})
            
            # H2H features
            h2h_key = tuple(sorted([home_team, away_team]))
            home_h2h = home_stats.get('h2h', {}).get(h2h_key, {})
            h2h_matches = home_h2h.get('wins', 0) + home_h2h.get('draws', 0) + (away_stats.get('h2h', {}).get(h2h_key, {}).get('wins', 0))
            h2h_home_wins = home_h2h.get('wins', 0)
            h2h_draws = home_h2h.get('draws', 0)
            h2h_goals = home_h2h.get('goals_for', 0) + away_stats.get('h2h', {}).get(h2h_key, {}).get('goals_for', 0)
            
            features = [
                home_elo / 2000,  # Normalized ELO
                away_elo / 2000,
                home_elo - away_elo,  # ELO diff
                home_stats.get('avg_goals_scored', 1.2) / 3,  # Normalized
                home_stats.get('avg_goals_conceded', 1.3) / 3,
                away_stats.get('avg_goals_scored', 1.2) / 3,
                away_stats.get('avg_goals_conceded', 1.3) / 3,
                home_stats.get('win_rate', 0.33),
                away_stats.get('win_rate', 0.33),
                home_stats.get('over25_rate', 0.5),
                away_stats.get('over25_rate', 0.5),
                home_stats.get('btts_rate', 0.5),
                away_stats.get('btts_rate', 0.5),
                home_stats.get('clean_sheet_rate', 0.3),
                away_stats.get('clean_sheet_rate', 0.3),
                home_stats.get('streak', 0) / 3,  # Normalized streak
                away_stats.get('streak', 0) / 3,
                h2h_matches / 20,  # H2H frequency
                h2h_home_wins / max(h2h_matches, 1),  # H2H home win rate
                h2h_draws / max(h2h_matches, 1),  # H2H draw rate
                h2h_goals / max(h2h_matches * 2, 1),  # H2H avg goals
                league_avg / 4,  # League tendency
            ]
            
            X.append(features)
            y_home_win.append(1 if home_score > away_score else (0.5 if home_score == away_score else 0))
            y_over25.append(1 if home_score + away_score > 2.5 else 0)
            y_btts.append(1 if home_score > 0 and away_score > 0 else 0)
            y_score.append([home_score, away_score])
    
    return X, y_home_win, y_over25, y_btts, y_score

# Simple Neural Network (from scratch)
class SimpleNeuralNet:
    def __init__(self, input_size, hidden_sizes=[16, 8], output_size=1, learning_rate=0.01):
        self.lr = learning_rate
        self.weights = []
        self.biases = []
        
        sizes = [input_size] + hidden_sizes + [output_size]
        for i in range(len(sizes) - 1):
            # Xavier initialization
            scale = math.sqrt(2.0 / (sizes[i] + sizes[i+1]))
            self.weights.append([
                [random.gauss(0, scale) for _ in range(sizes[i])]
                for _ in range(sizes[i+1])
            ])
            self.biases.append([0.0] * sizes[i+1])
    
    def sigmoid(self, x):
        return 1 / (1 + math.exp(-max(-500, min(500, x))))
    
    def sigmoid_deriv(self, x):
        s = self.sigmoid(x)
        return s * (1 - s)
    
    def relu(self, x):
        return max(0, x)
    
    def relu_deriv(self, x):
        return 1 if x > 0 else 0
    
    def forward(self, X):
        self.activations = [X]
        self.z_values = []
        
        for i, (w, b) in enumerate(zip(self.weights, self.biases)):
            z = []
            for j in range(len(w)):
                val = b[j] + sum(w[j][k] * self.activations[-1][k] for k in range(len(w[j])))
                z.append(val)
            self.z_values.append(z)
            
            if i < len(self.weights) - 1:
                self.activations.append([self.relu(v) for v in z])
            else:
                self.activations.append([self.sigmoid(v) for v in z])
        
        return self.activations[-1]
    
    def backward(self, y):
        m = len(y)
        deltas = []
        
        # Output layer
        output = self.activations[-1]
        output_delta = [(output[i] - y[i]) * self.sigmoid_deriv(self.z_values[-1][i]) for i in range(len(y))]
        deltas.insert(0, output_delta)
        
        # Hidden layers
        for i in range(len(self.weights) - 2, -1, -1):
            hidden_delta = []
            for j in range(len(self.weights[i][0])):
                delta = sum(self.weights[i+1][k][j] * deltas[0][k] for k in range(len(deltas[0]))) * self.relu_deriv(self.z_values[i][j])
                hidden_delta.append(delta)
            deltas.insert(0, hidden_delta)
        
        # Update weights
        for i in range(len(self.weights)):
            for j in range(len(self.weights[i])):
                for k in range(len(self.weights[i][j])):
                    self.weights[i][j][k] -= (self.lr / m) * deltas[i][j] * self.activations[i][k]
                self.biases[i][j] -= (self.lr / m) * deltas[i][j]
    
    def train(self, X, y, epochs=100, batch_size=32):
        for epoch in range(epochs):
            # Shuffle
            combined = list(zip(X, y))
            random.shuffle(combined)
            X, y = zip(*combined)
            
            total_loss = 0
            for i in range(0, len(X), batch_size):
                batch_X = X[i:i+batch_size]
                batch_y = y[i:i+batch_size]
                
                outputs = [self.forward(x) for x in batch_X]
                self.backward(batch_y)
                
                for j, o in enumerate(outputs):
                    total_loss += (o[0] - batch_y[j]) ** 2
            
            if epoch % 20 == 0:
                print(f"  Epoch {epoch}: Loss = {total_loss/len(X):.4f}")
    
    def predict(self, X):
        return [self.forward(x)[0] for x in X]

# Random Forest (simplified)
class DecisionTree:
    def __init__(self, max_depth=5, min_samples=10):
        self.max_depth = max_depth
        self.min_samples = min_samples
        self.feature = None
        self.threshold = None
        self.left = None
        self.right = None
        self.value = None
    
    def gini(self, y):
        if not y:
            return 0
        counts = {}
        for v in y:
            counts[v] = counts.get(v, 0) + 1
        impurity = 1
        for c in counts.values():
            p = c / len(y)
            impurity -= p * p
        return impurity
    
    def best_split(self, X, y):
        best_gini = float('inf')
        best_feat = None
        best_thresh = None
        
        n_features = len(X[0])
        n_samples = len(y)
        
        for f in range(min(n_features, 10)):  # Limit features
            values = sorted(set(x[f] for x in X))
            thresholds = [(values[i] + values[i+1]) / 2 for i in range(len(values) - 1)]
            
            for t in thresholds[:10]:  # Limit thresholds
                left_y = [y[i] for i in range(n_samples) if X[i][f] <= t]
                right_y = [y[i] for i in range(n_samples) if X[i][f] > t]
                
                if not left_y or not right_y:
                    continue
                
                gini = (len(left_y) * self.gini(left_y) + len(right_y) * self.gini(right_y)) / n_samples
                
                if gini < best_gini:
                    best_gini = gini
                    best_feat = f
                    best_thresh = t
        
        return best_feat, best_thresh
    
    def fit(self, X, y, depth=0):
        if depth >= self.max_depth or len(y) < self.min_samples:
            self.value = sum(y) / len(y) if y else 0.5
            return
        
        feat, thresh = self.best_split(X, y)
        if feat is None:
            self.value = sum(y) / len(y) if y else 0.5
            return
        
        self.feature = feat
        self.threshold = thresh
        
        left_X, left_y, right_X, right_y = [], [], [], []
        for i in range(len(X)):
            if X[i][feat] <= thresh:
                left_X.append(X[i])
                left_y.append(y[i])
            else:
                right_X.append(X[i])
                right_y.append(y[i])
        
        self.left = DecisionTree(self.max_depth, self.min_samples)
        self.right = DecisionTree(self.max_depth, self.min_samples)
        self.left.fit(left_X, left_y, depth + 1)
        self.right.fit(right_X, right_y, depth + 1)
    
    def predict_one(self, x):
        if self.value is not None:
            return self.value
        if x[self.feature] <= self.threshold:
            return self.left.predict_one(x)
        return self.right.predict_one(x)
    
    def predict(self, X):
        return [self.predict_one(x) for x in X]

class RandomForest:
    def __init__(self, n_trees=10, max_depth=5, min_samples=10):
        self.n_trees = n_trees
        self.trees = [DecisionTree(max_depth, min_samples) for _ in range(n_trees)]
    
    def fit(self, X, y):
        print(f"Training Random Forest with {self.n_trees} trees...")
        for i, tree in enumerate(self.trees):
            print(f"  Training tree {i+1}/{self.n_trees}...")
            # Bootstrap sample
            indices = [random.randint(0, len(X) - 1) for _ in range(len(X))]
            boot_X = [X[idx] for idx in indices]
            boot_y = [y[idx] for idx in indices]
            tree.fit(boot_X, boot_y)
    
    def predict(self, X):
        predictions = [[tree.predict_one(x) for x in X] for tree in self.trees]
        return [sum(p[i] for p in predictions) / self.n_trees for i in range(len(X))]

# Evaluate model
def evaluate(y_true, y_pred, threshold=0.5):
    correct = 0
    for t, p in zip(y_true, y_pred):
        pred_class = 1 if p >= threshold else 0
        if pred_class == t:
            correct += 1
    return correct / len(y_true)

# Main training
def main():
    print("=" * 50)
    print("ML Training for Virtual Sports Prediction")
    print("=" * 50)
    
    print("\n1. Loading data...")
    history = load_data()
    print(f"   Loaded {len(history)} matchdays")
    
    print("\n2. Calculating ELO ratings...")
    elo_ratings = calculate_elo(history)
    print(f"   Calculated ELO for {len(elo_ratings)} teams")
    
    print("\n3. Calculating team statistics...")
    team_stats, league_stats = calculate_team_stats(history)
    print(f"   Calculated stats for {len(team_stats)} teams")
    
    print("\n4. Generating training data...")
    X, y_home_win, y_over25, y_btts, y_score = generate_training_data(
        history, elo_ratings, team_stats, league_stats
    )
    print(f"   Generated {len(X)} samples")
    
    # Split data
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_home_train, y_home_test = y_home_win[:split_idx], y_home_win[split_idx:]
    y_over25_train, y_over25_test = y_over25[:split_idx], y_over25[split_idx:]
    y_btts_train, y_btts_test = y_btts[:split_idx], y_btts[split_idx:]
    
    print("\n5. Training models...")
    
    # Train Random Forest for home win
    print("\n   [Home Win Model]")
    rf_home = RandomForest(n_trees=10, max_depth=6)
    rf_home.fit(X_train, y_home_train)
    home_pred = rf_home.predict(X_test)
    home_acc = evaluate(y_home_test, home_pred, 0.5)
    print(f"   Home Win Accuracy: {home_acc:.2%}")
    
    # Train Random Forest for over 2.5
    print("\n   [Over 2.5 Model]")
    rf_over = RandomForest(n_trees=10, max_depth=6)
    rf_over.fit(X_train, y_over25_train)
    over_pred = rf_over.predict(X_test)
    over_acc = evaluate(y_over25_test, over_pred, 0.5)
    print(f"   Over 2.5 Accuracy: {over_acc:.2%}")
    
    # Train Random Forest for BTTS
    print("\n   [BTTS Model]")
    rf_btts = RandomForest(n_trees=10, max_depth=6)
    rf_btts.fit(X_train, y_btts_train)
    btts_pred = rf_btts.predict(X_test)
    btts_acc = evaluate(y_btts_test, btts_pred, 0.5)
    print(f"   BTTS Accuracy: {btts_acc:.2%}")
    
    # Ensemble prediction (average of all models)
    print("\n   [Ensemble Model]")
    ensemble_pred = [(home_pred[i] * 0.4 + over_pred[i] * 0.3 + btts_pred[i] * 0.3) for i in range(len(X_test))]
    ensemble_acc = evaluate(y_home_test, ensemble_pred, 0.5)
    print(f"   Ensemble Accuracy: {ensemble_acc:.2%}")
    
    print("\n6. Exporting models...")
    
    # Export as JSON for app
    model_data = {
        'models': {
            'home_win': {
                'trees': [
                    {
                        'feature': t.feature,
                        'threshold': t.threshold,
                        'value': t.value,
                        'left': {
                            'feature': t.left.feature if t.left else None,
                            'threshold': t.left.threshold if t.left else None,
                            'value': t.left.value if t.left else None,
                        } if t.left else None,
                        'right': {
                            'feature': t.right.feature if t.right else None,
                            'threshold': t.right.threshold if t.right else None,
                            'value': t.right.value if t.right else None,
                        } if t.right else None,
                    } for t in rf_home.trees
                ]
            },
            'over25': {
                'trees': rf_over.trees
            },
            'btts': {
                'trees': rf_btts.trees
            }
        },
        'stats': {
            'accuracy': {
                'home_win': home_acc,
                'over25': over_acc,
                'btts': btts_acc,
                'ensemble': ensemble_acc
            },
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'total_matchdays': len(history)
        },
        'elo_ratings': elo_ratings,
        'team_stats': {k: {
            'avg_goals_scored': v.get('avg_goals_scored', 0),
            'avg_goals_conceded': v.get('avg_goals_conceded', 0),
            'win_rate': v.get('win_rate', 0.33),
            'over25_rate': v.get('over25_rate', 0.5),
            'btts_rate': v.get('btts_rate', 0.5),
            'clean_sheet_rate': v.get('clean_sheet_rate', 0),
            'streak': v.get('streak', 0),
        } for k, v in team_stats.items()},
        'league_stats': {k: {
            'avg_goals': v['total_goals'] / max(v['total_matches'], 1)
        } for k, v in league_stats.items()},
        'version': '1.0',
        'trained_at': datetime.now().isoformat()
    }
    
    with open('data/ml_models/prediction_model.json', 'w') as f:
        json.dump(model_data, f, indent=2)
    
    print("\n" + "=" * 50)
    print("TRAINING COMPLETE!")
    print("=" * 50)
    print(f"\nModel saved to: data/ml_models/prediction_model.json")
    print(f"\nAccuracy Summary:")
    print(f"  Home Win:  {home_acc:.1%}")
    print(f"  Over 2.5:  {over_acc:.1%}")
    print(f"  BTTS:      {btts_acc:.1%}")
    print(f"  Neural Net: {nn_acc:.1%}")
    print("\nNote: Real betting accuracy of 55%+ is considered good!")

if __name__ == '__main__':
    main()
