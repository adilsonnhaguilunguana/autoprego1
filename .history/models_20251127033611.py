class DailyPeak(db.Model):
    __tablename__ = "daily_peaks"
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, default=datetime.utcnow().date, index=True)
    pzem_id = db.Column(db.Integer, nullable=False)
    value = db.Column(db.Float, nullable=False)
    time = db.Column(db.Time, nullable=False)

class WeeklyPeak(db.Model):
    __tablename__ = "weekly_peaks"
    id = db.Column(db.Integer, primary_key=True)
    week_start = db.Column(db.Date, index=True)  # primeiro dia da semana
    pzem_id = db.Column(db.Integer, nullable=False)
    value = db.Column(db.Float, nullable=False)
    time = db.Column(db.Time, nullable=False)

class MonthlyPeak(db.Model):
    __tablename__ = "monthly_peaks"
    id = db.Column(db.Integer, primary_key=True)
    month = db.Column(db.Integer, index=True)  # 1 a 12
    year = db.Column(db.Integer, index=True)
    pzem_id = db.Column(db.Integer, nullable=False)
    value = db.Column(db.Float, nullable=False)
    time = db.Column(db.Time, nullable=False)
