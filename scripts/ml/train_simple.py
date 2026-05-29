#!/usr/bin/env python3
"""
Simplified ML Model Export
Creates a lightweight model that can be easily used in the browser
"""

import json
import math
import random
from collections import defaultdict

random.seed(42)

def load_data():
    with open('data/betpawa_history.json', 'r') as f:
        return json.load(f)

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
            
            home_elo = elo_ratings[home_team]
            away_elo = elo_ratings[away_team]
            
            expected_home = 1 / (1 + 10 ** ((away_elo - home_elo) / 400))
            
            if home_score > away_score:
                actual_home = 1
            elif home_score == away_score:
                actual_home = 0.5
            else:
                actual_home = 0
            
            elo_ratings[home_team] += K_FACTOR * (actual_home - expected_home)
            elo_ratings[away_team] += K_FACTOR * ((1 - actual_home) - (1 - expected_home))
    
    return dict(elo_ratings)

def calculate_stats(history):
    stats = defaultdict(lambda: {
        'matches': 0, 'wins': 0, 'draws': 0, 'losses': 0,
        'goals_scored': 0, 'goals_conceded': 0, 'over25': 0, 'btts_yes': 0,
        'clean_sheets': 0, 'h2h_wins': defaultdict(int), 'h2h_draws': defaultdict(int),
        'recent_form': []
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
                stats[away_team]['losses'] += 1
            elif home_score == away_score:
                stats[home_team]['draws'] += 1
                stats[away_team]['draws'] += 1
            else:
                stats[away_team]['wins'] += 1
                stats[home_team]['losses'] += 1
            
            if total_goals > 2.5:
                stats[home_team]['over25'] += 1
                stats[away_team]['over25'] += 1
            
            if home_score > 0 and away_score > 0:
                stats[home_team]['btts_yes'] += 1
                stats[away_team]['btts_yes'] += 1
            
            if away_score == 0:
                stats[home_team]['clean_sheets'] += 1
            if home_score == 0:
                stats[away_team]['clean_sheets'] += 1
            
            # H2H
            h2h_key = tuple(sorted([home_team, away_team]))
            if home_score > away_score:
                stats[home_team]['h2h_wins'][h2h_key] += 1
            elif home_score == away_score:
                stats[home_team]['h2h_draws'][h2h_key] += 1
                stats[away_team]['h2h_draws'][h2h_key] += 1
            else:
                stats[away_team]['h2h_wins'][h2h_key] += 1
            
            # Recent form
            stats[home_team]['recent_form'].append('W' if home_score > away_score else ('D' if home_score == away_score else 'L'))
            stats[away_team]['recent_form'].append('W' if away_score > home_score else ('D' if home_score == away_score else 'L'))
            
            # Keep only last 5
            for team in [home_team, away_team]:
                if len(stats[team]['recent_form']) > 5:
                    stats[team]['recent_form'] = stats[team]['recent_form'][-5:]
    
    # Calculate derived stats
    result = {}
    for team, s in stats.items():
        # Calculate streak
        form = s['recent_form']
        streak = 0
        if len(form) >= 3:
            if form[-1] == form[-2] == form[-3]:
                streak = 3 if form[-1] == 'W' else (-3 if form[-1] == 'L' else 0)
        
        result[team] = {
            'matches': s['matches'],
            'wins': s['wins'],
            'draws': s['draws'],
            'losses': s['losses'],
            'avg_goals_scored': s['goals_scored'] / max(s['matches'], 1),
            'avg_goals_conceded': s['goals_conceded'] / max(s['matches'], 1),
            'win_rate': s['wins'] / max(s['matches'], 1),
            'over25_rate': s['over25'] / max(s['matches'], 1),
            'btts_rate': s['btts_yes'] / max(s['matches'], 1),
            'clean_sheet_rate': s['clean_sheets'] / max(s['matches'], 1),
            'recent_form': form[-5:] if form else [],
            'streak': streak,
        }
    
    return result, dict(league_stats)

def learn_weights(history, elo_ratings, team_stats, league_stats):
    """
    Learn optimal feature weights using logistic regression approach
    """
    # Features: ELO diff, goal diff, form diff, H2H diff
    # Target: home win (1), draw (0.5), away win (0)
    
    feature_sums = {
        'elo_diff': {'home_win': 0, 'total': 0},
        'goal_diff': {'home_win': 0, 'total': 0},
        'form_diff': {'home_win': 0, 'total': 0},
        'over25_diff': {'home_win': 0, 'total': 0},
        'btts_diff': {'home_win': 0, 'total': 0},
    }
    
    total_home_wins = 0
    total_matches = 0
    
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
            
            home_stats = team_stats.get(home_team, {})
            away_stats = team_stats.get(away_team, {})
            
            elo_diff = elo_ratings.get(home_team, 1500) - elo_ratings.get(away_team, 1500)
            goal_diff = home_stats.get('avg_goals_scored', 1.2) - away_stats.get('avg_goals_scored', 1.2)
            
            # Form calculation
            home_form = home_stats.get('recent_form', [])
            away_form = away_stats.get('recent_form', [])
            form_diff = (home_form.count('W') - home_form.count('L')) - (away_form.count('W') - away_form.count('L'))
            
            over25_diff = home_stats.get('over25_rate', 0.5) - away_stats.get('over25_rate', 0.5)
            btts_diff = home_stats.get('btts_rate', 0.5) - away_stats.get('btts_rate', 0.5)
            
            is_home_win = 1 if home_score > away_score else 0
            
            feature_sums['elo_diff']['home_win'] += elo_diff * is_home_win
            feature_sums['elo_diff']['total'] += abs(elo_diff)
            
            feature_sums['goal_diff']['home_win'] += goal_diff * is_home_win
            feature_sums['goal_diff']['total'] += abs(goal_diff) + 0.001
            
            feature_sums['form_diff']['home_win'] += form_diff * is_home_win
            feature_sums['form_diff']['total'] += abs(form_diff) + 1
            
            feature_sums['over25_diff']['home_win'] += over25_diff * is_home_win
            feature_sums['over25_diff']['total'] += abs(over25_diff) + 0.001
            
            feature_sums['btts_diff']['home_win'] += btts_diff * is_home_win
            feature_sums['btts_diff']['total'] += abs(btts_diff) + 0.001
            
            total_home_wins += is_home_win
            total_matches += 1
    
    # Calculate weights (simplified)
    base_rate = total_home_wins / max(total_matches, 1)
    
    weights = {}
    for feat, data in feature_sums.items():
        if data['total'] > 0:
            # Weight = how much this feature predicts home wins
            avg_val = data['home_win'] / max(data['total'], 0.001)
            weights[feat] = avg_val / (1 - base_rate + 0.001)
        else:
            weights[feat] = 1.0
    
    # Normalize
    total_weight = sum(weights.values())
    weights = {k: v / total_weight * 3 for k, v in weights.items()}
    
    return weights, base_rate

def learn_market_weights(history, team_stats):
    """
    Learn weights for over/under and BTTS predictions
    """
    over25_correct = 0
    btts_correct = 0
    total = 0
    
    over25_features = {'home_attack': 0, 'away_defense': 0, 'league_avg': 0}
    btts_features = {'home_btts': 0, 'away_btts': 0, 'league_avg': 0}
    
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
            
            home_stats = team_stats.get(home_team, {})
            away_stats = team_stats.get(away_team, {})
            
            total_goals = home_score + away_score
            actual_over25 = 1 if total_goals > 2.5 else 0
            actual_btts = 1 if home_score > 0 and away_score > 0 else 0
            
            predicted_over25 = 1 if (home_stats.get('avg_goals_scored', 1.2) + away_stats.get('avg_goals_conceded', 1.3)) > 2.5 else 0
            predicted_btts = 1 if home_stats.get('btts_rate', 0.5) > 0.5 and away_stats.get('btts_rate', 0.5) > 0.5 else 0
            
            if predicted_over25 == actual_over25:
                over25_correct += 1
            if predicted_btts == actual_btts:
                btts_correct += 1
            total += 1
            
            over25_features['home_attack'] += home_stats.get('avg_goals_scored', 1.2) * actual_over25
            over25_features['away_defense'] += away_stats.get('avg_goals_conceded', 1.3) * actual_over25
            btts_features['home_btts'] += home_stats.get('btts_rate', 0.5) * actual_btts
            btts_features['away_btts'] += away_stats.get('btts_rate', 0.5) * actual_btts
    
    return {
        'over25_accuracy': over25_correct / max(total, 1),
        'btts_accuracy': btts_correct / max(total, 1),
        'over25_threshold': 2.5,
        'btts_threshold': 0.5,
    }

def main():
    print("=" * 50)
    print("ML Model Training - Simplified Export")
    print("=" * 50)
    
    print("\n1. Loading data...")
    history = load_data()
    print(f"   Loaded {len(history)} matchdays")
    
    print("\n2. Calculating ELO ratings...")
    elo_ratings = calculate_elo(history)
    print(f"   ELO ratings for {len(elo_ratings)} teams")
    
    print("\n3. Calculating statistics...")
    team_stats, league_stats = calculate_stats(history)
    print(f"   Stats for {len(team_stats)} teams")
    
    print("\n4. Learning feature weights...")
    weights, base_rate = learn_weights(history, elo_ratings, team_stats, league_stats)
    print(f"   Base home win rate: {base_rate:.1%}")
    print(f"   Feature weights learned:")
    for feat, w in weights.items():
        print(f"     - {feat}: {w:.3f}")
    
    print("\n5. Learning market predictions...")
    market_stats = learn_market_weights(history, team_stats)
    print(f"   Over 2.5 accuracy: {market_stats['over25_accuracy']:.1%}")
    print(f"   BTTS accuracy: {market_stats['btts_accuracy']:.1%}")
    
    print("\n6. Exporting model...")
    
    # Create simplified model for app
    model = {
        'version': '1.0',
        'trained_at': str(__import__('datetime').datetime.now()),
        'training_data': {
            'total_matchdays': len(history),
            'total_matches': sum(len(day['matches']) for day in history),
            'total_teams': len(team_stats),
        },
        'base_rates': {
            'home_win': base_rate,
            'draw': 1 - base_rate - (1 - base_rate - (team_stats.get(list(team_stats.keys())[0], {}).get('draws', 1) / max(team_stats.get(list(team_stats.keys())[0], {}).get('matches', 1), 1))),
        },
        'weights': weights,
        'market': market_stats,
        'elo_ratings': elo_ratings,
        'team_stats': team_stats,
        'league_stats': {k: v['total_goals'] / max(v['total_matches'], 1) for k, v in league_stats.items()},
    }
    
    with open('data/ml_models/simplified_model.json', 'w') as f:
        json.dump(model, f, indent=2)
    
    print(f"\nModel saved to: data/ml_models/simplified_model.json")
    print("\n" + "=" * 50)
    print("TRAINING COMPLETE!")
    print("=" * 50)
    
    # Summary
    print("\nModel Accuracy Summary:")
    print(f"  Home Win prediction: {base_rate:.1%} (baseline)")
    print(f"  Over 2.5 prediction: {market_stats['over25_accuracy']:.1%}")
    print(f"  BTTS prediction: {market_stats['btts_accuracy']:.1%}")
    print("\nThis model is now ready to be integrated into the app!")

if __name__ == '__main__':
    main()
