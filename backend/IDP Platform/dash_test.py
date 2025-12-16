from fastapi import FastAPI
from starlette.middleware.wsgi import WSGIMiddleware
import dash
from dash import html, dcc
import plotly.express as px
 
fastapi_app = FastAPI()
 
@fastapi_app.get("/")
def home():
    return {"status": "OK", "dashboard": "/dashboard/"}
 
dash_app = dash.Dash(
    __name__,
    requests_pathname_prefix="/dashboard/"
)
 
df = px.data.gapminder()
fig = px.line(df[df.country == "India"], x="year", y="lifeExp")
 
dash_app.layout = html.Div([
    html.H2("Power BI Style Dashboard"),
    dcc.Graph(figure=fig)
])
 
fastapi_app.mount("/dashboard", WSGIMiddleware(dash_app.server))
 