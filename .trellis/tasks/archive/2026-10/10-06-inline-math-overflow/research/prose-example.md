> At initialization, we have $\theta = 0 = \sum_{i=1}^n 0 \cdot \varphi(x^{(i)})$
>
> Assume at some point, $\theta$ can be represented as
>
> $$\theta = \sum_{i=1}^n \beta_i \varphi(x^{(i)}), \beta_1, \ldots, \beta_n \in \mathbb{R}$$
>
> Then we claim that in the next round, $\theta$ is still a linear combination of $\varphi(x^{(1)}), \ldots, \varphi(x^{(n)})$ because:
>
> $$\begin{aligned}\theta &:= \theta + \alpha \sum_{i=1}^n \left( y^{(i)} - \theta^T \varphi(x^{(i)}) \right) \varphi(x^{(i)}) \\&= \sum_{i=1}^n \beta_i \varphi(x^{(i)}) + \alpha \sum_{i=1}^n \left( y^{(i)} - \theta^T \varphi(x^{(i)}) \right) \varphi(x^{(i)}) \\&= \sum_{i=1}^n \underbrace{\left( \beta_i + \alpha \left( y^{(i)} - \theta^T \varphi(x^{(i)}) \right) \right)}_{\text{new } \beta_i} \varphi(x^{(i)})\end{aligned}$$
